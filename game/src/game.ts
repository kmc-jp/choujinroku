import { Character, getAllCharacters } from "./character";
import { Player, PlayerActionTag } from "./player";
import { Choice, choices } from "./choice";
import { FieldAction, FieldItemAction } from "./fieldaction";
import { Land, getLands, LandName, EventWrapper, ItemGetJudgeableLand } from "./land";
import { ItemCategoryDict, Item, getItemsData, ItemCategory, Friend, getFriendsData, FriendName } from "./item";
import * as _ from "underscore";
import { Pos, PosType } from "./pos";
import { SpellCard, getAllSpellCards } from "./spellcard";
import { TwoDice, dice, twoDice, Attribute, NPCType, HookAtoBWhen, HookAWhen, SpecificActionHook, HookAbyBWhen, HookBattleWhen } from "./hook";

// デコレータ
function phase(target: Game, propertyKey: string, descriptor: PropertyDescriptor) {
  let original = descriptor.value;
  descriptor.value = function (this: Game, ...args: any[]) {
    this.phase(() => original.bind(this)(...args));
  }
}

// 現在はブラウザで動いているが、サーバーで動いてもいい感じになってほしい気持ちで書く
export class Game {
  players: Player[];
  map: (Land | null)[][];
  itemsOnMap: (Item | null)[][];
  leftLands: Land[];
  leftItems: ItemCategoryDict;
  leftSpellCards: SpellCard[];
  leftFriends: Friend[];
  usedSpellCards: SpellCard[] = [];
  actionStack: (() => any)[] = [];
  temporaryActionStack: (() => any)[] = [];
  turn: number = 0;
  leftCharacters: Character[]; // 転生やランダムキャラの候補となりうるキャラクター
  usedCharacters: Character[] = []; // 転生やランダムキャラで消え去ったキャラクター
  choiceLog: string[] = [];
  // 外部からのゲーム状態の更新はすべてこの関数を経由して行う
  // すなわち内部的には選択肢を選ぶことでのみゲームを進める
  public decide(playerId: number, choiceId: number) {
    let player = this.players[playerId];
    let choice = player.choices[choiceId];
    this.choiceLog.push(player.name + ":" + choice.toString());
    player.choices = [];
    choice.invoke();
    this.normalizeActionStack();
  }
  // ids が不正な場合があるので private constructor
  static tryToStartGame(ids: number[]): Game | null {
    if (ids.length <= 1) return null; // 一人プレイは不可能
    if (ids.length !== _.uniq(ids).length) return null; // 同じキャラは不可能
    if (ids.some(x => x < 0 || x >= getAllCharacters().length)) return null; // 変なキャラは不可能
    return new Game(ids);
  }
  private constructor(ids: number[]) {
    this.leftCharacters = getAllCharacters();
    this.players = ids.map((x, i) => new Player(this, this.leftCharacters[x], `${i + 1}P`, i));
    this.leftCharacters = this.leftCharacters.filter(x => ids.every(y => x.id !== y));
    this.leftSpellCards = _.shuffle(getAllSpellCards());
    this.map = _.range(6).map(() => _.range(6).map(() => null));
    this.leftLands = _.shuffle(getLands());
    while (this.leftLands.slice(0, 18).some(x => ["図書館", "香霖堂", "工房"].includes(x.name)))
      this.leftLands = _.shuffle(this.leftLands);
    this.leftItems = getItemsData();
    this.leftFriends = getFriendsData();
    this.itemsOnMap = this.placeItemsOnMap();
    this.decideFirstPlace(this.players[0]);
    this.normalizeActionStack();
  }
  private placeItemsOnMap(): (Item | null)[][] {
    let keys: ItemCategory[] = ["本", "発明品", "宝物", "品物"];
    keys.forEach(x => this.leftItems[x] = _.shuffle(this.leftItems[x]));
    let items = [
      ...this.leftItems["本"].splice(-2),
      ...this.leftItems["発明品"].splice(-2),
      ...this.leftItems["宝物"].splice(-2),
      ...this.leftItems["品物"].splice(-10),
    ];
    items = _.shuffle(items);
    let i = 0;
    let result: (Item | null)[][] = _.range(6).map(x => _.range(6).map(y => {
      if (x === 0 || y === 0 || x === 5 || y === 5) return null;
      return items[i++];
    }));
    return result;
  }
  private normalizeActionStack() {
    this.actionStack.push(...this.temporaryActionStack.reverse());
    this.temporaryActionStack = [];
    while (this.players.every(x => x.choices.length === 0)) {
      let f = this.actionStack.pop();
      if (f) f();
      else break;
      this.actionStack.push(...this.temporaryActionStack.reverse());
      this.temporaryActionStack = [];
    }
  }
  private getMoveChoices(player: Player, poses: Pos[], tag: "移動1" | "移動2"): Choice[] {
    let tmp: any = poses.map(x => [x.x * 100 + x.y, x]);
    tmp = Array.from(new Map(tmp).values());
    poses = tmp;
    return poses.map(p => {
      // 見やすいようにタグを整形
      let addTag: string;
      let pos = player.pos;
      if (p.x - pos.x === 1 && p.y - pos.y === 0) addTag = "→";
      else if (p.x - pos.x === -1 && p.y - pos.y === 0) addTag = "←";
      else if (p.x - pos.x === 0 && p.y - pos.y === 1) addTag = "↓";
      else if (p.x - pos.x === 0 && p.y - pos.y === -1) addTag = "↑";
      else {
        addTag = `${p.x},${p.y}`
        let map = this.map[p.x][p.y];
        if (map) addTag = map.name;
      }
      return new Choice(`${tag} (${addTag})`, () => {
        player.actions.push(tag);
        if (tag === "移動2") this.mayDropItem(player);
        this.openRandomLand(player, p);
        this.enterLand(player, p);
        this.doFieldAction(player)
      })
    });
  }
  private getNextToPos(land: Land): Pos[] {
    let result: Pos[] = []
    _.range(6).forEach(x => {
      _.range(6).forEach(y => {
        let here = this.map[x][y];
        if (!here) return;
        if (land.nextTo.includes(here.name))
          result.push(new Pos(x, y));
      })
    })
    return result;
  }
  private parseFieldAction(player: Player, fieldActions: FieldAction[], tag: PlayerActionTag): Choice[] {
    let result: Choice[] = []
    for (let fieldAction of fieldActions) {
      let choices = fieldAction.bind(this)(player);
      for (let choice of choices) choice.wrapBefore(() => {
        player.actions.push(tag);
        this.doFieldAction(player);
      });
      result.push(...choices);
    }
    return result;
  }
  // WARN: 共通化しておきたい？
  private parseFieldItemAction(player: Player, item: Item): Choice[] {
    let result: Choice[] = []
    for (let fieldAction of item.fieldActions) {
      let choices = fieldAction.bind(this)(player, item);
      for (let choice of choices) choice.wrapBefore(() => {
        player.actions.push("アイテム")
        this.doFieldAction(player);
      });
      result.push(...choices);
    }
    return result;
  }
  // pos にいるプレイヤー
  getPlayersAt(pos: Pos): Player[] {
    if (pos.isOutOfLand()) return [];
    return this.players.filter(x => x.pos.x === pos.x && x.pos.y === pos.y);
  }
  // 縦横で隣接したマスにいるプレイヤー
  getPlayersNextTo(pos: Pos): Player[] {
    return this.players.filter(x => 1 === Math.abs(x.pos.x - pos.x) + Math.abs(x.pos.y - pos.y))
  }
  getOthers(player: Player): Player[] {
    return this.players.filter(x => x.id !== player.id);
  }
  getOthersAtSamePos(player: Player): Player[] {
    return this.getPlayersAt(player.pos).filter(x => x.id !== player.id);
  }
  getOthersAtNextTo(player: Player): Player[] {
    return this.getPlayersNextTo(player.pos).filter(x => x.id !== player.id);
  }
  getOthersAtNextToOrSamePos(player: Player): Player[] {
    return this.getOthersAtNextTo(player).concat(this.getOthersAtSamePos(player))
  }
  getDiceChoices(player: Player, tag: string, action: (x: number) => void, allowBomb = true): Choice[] {
    let rolled = dice();
    let result = [new Choice(tag + `ダイス確定(${rolled})`, () => action(rolled))]
    if (allowBomb && player.bomb > 0) {
      result.push(new Choice(tag + `:ボムを使って振り直す`, () => {
        player.bomb--;
        player.choices = this.getDiceChoices(player, tag, action, false);
      }))
    }
    return result;
  }
  getTwoDiceChoices(player: Player, tag: string, action: (x: TwoDice) => void, allowBomb = true): Choice[] {
    let rolled = twoDice();
    let result = [new Choice(tag + `ダイス確定(${rolled.a},${rolled.b})`, () => action(rolled))]
    if (allowBomb && player.bomb > 0) {
      result.push(new Choice(tag + `:ボムを使って振り直す`, () => {
        player.bomb--;
        player.choices = this.getTwoDiceChoices(player, tag, action, false);
      }))
    }
    return result;
  }
  drawACard(player: Player) {
    // 山札からカードを1枚引く
    if (this.leftSpellCards.length > 0) {
      let top = this.leftSpellCards[this.leftSpellCards.length - 1];
      this.leftSpellCards.pop();
      player.spellCards.push(top);
      return;
    }
    this.leftSpellCards = _.shuffle(this.usedSpellCards);
    this.drawACard(player);
  }
  // 捨て札にスペルカードを捨てる
  // WARN:戦闘中に捨てたカードを引かれるかもしれない
  discardACard(player: Player, card: SpellCard) {
    if (player.spellCards.length <= 0) return;
    this.usedSpellCards.push(card);
    player.spellCards = player.spellCards.filter(x => x.id !== card.id);
  }
  // アイテムを元の場所に戻す本体の処理。
  // hook「アイテム損失」 が発生する
  sendBackItem(player: Player, item: Item) {
    player.items = player.items.filter(x => x.id !== item.id);
    this.leftItems[item.category].push(item);
    this.leftItems[item.category] = _.shuffle(this.leftItems[item.category]);
  }

  // @phase の付いた関数は 全ての以前の選択が決定したのち(= 選択肢が空になったら)
  // 実行される。つまり他の選択肢に独立に実行できる。
  // よって player.choices を新たに追加することで選択肢を安全に作成できる。
  // 基本的には player.choices に追加することになるが、
  // 一人だけの決定で終わるわけではないので だれの選択肢でも増やせるようになっている
  // (例:お見合いは次の全員の了承が必要)
  // 意味は以下と同じ(this.phase と function phase の違いに注意)
  phase(action: () => any) {
    this.temporaryActionStack.push(action);
  }

  // 初期配置選択肢: 1Pから開始位置を選んでもらう -----------------------------
  @phase decideFirstPlace(player: Player) {
    player.choices = Pos.getOutSides().map(pos => new Choice(`初期配置位置選択(${pos.x},${pos.y})`, () => {
      player.pos = pos;
      if (player.id < this.players.length - 1) {
        this.decideFirstPlace(this.players[player.id + 1]);
        return;
      }
      for (let player of this.players)
        this.openRandomLand(player, player.pos);
      this.doFieldAction(this.players[0]);
    }));
  }
  checkActionHookImpl(factor: Player, impl: (player: Player, specificActionHook: SpecificActionHook) => Choice[]) {
    // TODO:２つの選択肢が可能な時に片方しか選べない
    // WARN: 同じフックのタイミングがあるときは宣言した順にスタックに積まれて消費されていく
    for (let player of this.players) {
      player.getSpecificActions(factor).forEach(x => {
        let choices = impl(player, x);
        if (choices.length <= 0) return;
        if (x.needBomb) {
          if (player.bomb <= 0) return;
          player.choices.push(new Choice(`ボムを消費して${x.skillName ? x.skillName : "特殊能力"}を発動！`, () => {
            player.choices = choices;
          }));
        } else {
          player.choices.push(...choices);
        }
      })
      if (player.choices.length <= 0) continue;
      player.choices.push(new Choice("何もしない"));
    }
  }
  @phase checkActionHookAtoB(when: HookAtoBWhen, A: Player, B: Player) {
    this.checkActionHookImpl(A, (player, x) => {
      if (x.type !== "AtoB" || !x.when.includes(when)) return [];
      return x.hook.bind(this)(A, B, player);
    });
  }
  @phase checkActionHookA(when: HookAWhen, A: Player) {
    this.checkActionHookImpl(A, (player, x) => {
      if (x.type !== "A" || !x.when.includes(when)) return [];
      return x.hook.bind(this)(A, player);
    });
  }
  @phase checkActionHookAByB(when: HookAbyBWhen, A: Player, B?: Player) {
    this.checkActionHookImpl(A, (player, x) => {
      if (x.type !== "AbyB" || !x.when.includes(when)) return [];
      return x.hook.bind(this)(A, B, player);
    });
  }
  @phase checkActionHookBattle(when: HookBattleWhen, A: Player, B: Player, spellCard: SpellCard) {
    this.checkActionHookImpl(A, (player, x) => {
      if (x.type !== "Battle" || !x.when.includes(when)) return [];
      return x.hook.bind(this)(A, B, spellCard, player);
    });
  }

  // 手番 ----------------------------------------------------------------
  // 手番行動を決定する
  @phase doFieldAction(player: Player) {
    this.turn++;
    // 行動不能や2回行動した場合はターン終了
    if (!player.isAbleToAction || player.actions.length >= 2) {
      this.finishPlayerTurn(player);
      return;
    }
    // 次の手番は休み...
    if (player.skipTurnCounter > 0) {
      player.with("手番休み").choices = choices("今回の手番は休みだった...", () => {
        this.finishPlayerTurn(player);
      });
      return;
    }
    // 盤外にいる場合は特殊
    if (player.pos.isOutOfLand()) {
      // 既に行動済みな場合はそこで終了
      if (player.actions.length >= 1) return this.finishPlayerTurn(player);
      // 移動1で入る (全て行けない場合は特別にどこでも開けられる)
      let outsides = Pos.getOutSides().filter(x => this.map[x.x][x.y] !== null);
      if (outsides.length === 0) outsides = Pos.getOutSides();
      player.choices = this.getMoveChoices(player, outsides, "移動1");
      return;
    }
    // 必ず待機はできる
    player.choices = choices("待機", () => {
      player.actions.push("待機");
      player.addWaitCount();
      this.waitAndGetItem(player);
      this.checkActionHookA("待機", player);
      this.finishPlayerTurn(player);
    })
    // 移動1 / 移動2
    let moveTag: PlayerActionTag = "移動1";
    if (player.actions.includes("移動1")) moveTag = "移動2"
    if (!player.actions.includes("移動2")) {
      // 3手行動可能な時に移動1と移動2をしてるかもなのでこの条件
      let nextTo = player.pos.getNextTo();
      let map = player.currentLand;
      if (map) nextTo.push(...this.getNextToPos(map))
      player.choices.push(...this.getMoveChoices(player, nextTo, moveTag))
    }
    // アイテム
    if (!player.actions.includes("アイテム")) {
      // アイテムを拾う
      let itemHere = this.itemsOnMap[player.pos.x][player.pos.y];
      if (itemHere !== null) {
        player.choices.push(new Choice("アイテムを拾う", () => {
          player.actions.push("アイテム");
          let { x, y } = player.pos;
          this.itemsOnMap[x][y] = null;
          this.gainItem(player, itemHere!, false); // nullなわけないだろ！
          this.doFieldAction(player);
        }));
      }
      // アイテムのフィールド効果を発動
      for (let item of player.items) {
        player.choices.push(...this.parseFieldItemAction(player, item))
      }
      // TODO: アイテムを渡す (+ checkActionHook)
    }
    // 戦闘
    if (!player.actions.includes("戦闘")) {
      let versus = this.getPlayersAt(player.pos).filter(x => x.id !== player.id);
      player.choices.push(...versus.map(target => new Choice(`${target.name}と戦闘！`, () => {
        player.actions.push("戦闘");
        this.setupBattle(player, target);
        this.doFieldAction(player);
      })));
    }
    // B自 / 特殊能力の使用
    if (!player.actions.includes("特殊能力の使用")) {
      player.choices.push(...this.parseFieldAction(player, player.characterFieldActions, "特殊能力の使用"))
    }
  }
  // 待機をして香霖堂/図書館/工房チェック
  @phase waitAndGetItem(player: Player) {
    let map = player.currentLand;
    if (!map) return;
    if (player.waitCount <= 0) return;
    let lands: ItemGetJudgeableLand[] = ["図書館", "香霖堂", "工房"];
    let name = lands.filter(x => map ? x === map.name : false)[0];
    if (!name) return;
    player.choices = [
      new Choice(`今は${name}判定をしない`),
      new Choice(`${name}判定をする`, () => {
        player.choices = player.eventWrapper.judge(name, player.waitCount)
          .map(x => x.wrapAfter(() => { player.waitCount = 0; }));
      })
    ]
  }
  // 手番を終了する / お見合い
  @phase finishPlayerTurn(player: Player) {
    for (let p of this.players) {
      p.actions = [];
      p.isAbleToAction = true;
    }
    player.skipTurnCounter = Math.max(0, player.skipTurnCounter - 1)
    let sames = this.getPlayersAt(player.pos);
    if (player.pos.isOutOfLand() || sames.length <= 1) {
      this.doAfterFinishedPlayerTurn(player);
      return;
    }
    // 同じマスにいるキャラクターとのお見合い判定
    let dices = new Map<number, number>();
    sames.forEach(p => {
      p.choices = this.getDiceChoices(p, "お見合い", x => {
        // 全員の出目が確定するまで待つ
        dices.set(p.id, x);
        if (dices.size < sames.length) return;
        // まだ見ていない同士で全員お見合いをする(この順序は残念ながら不定である)
        for (let p of sames) {
          sames.filter(x =>
            x.id !== p.id
            && dices.get(x.id) === dices.get(p.id)
            && !p.watched.has(x.id))
            .forEach(x => this.watch(p, x));
        }
        this.doAfterFinishedPlayerTurn(player);
      }, false);
    });
  }
  getNextPlayer(player: Player): Player {
    return this.players[(player.id + 1) % this.players.length];
  }
  getPrePlayer(player: Player): Player {
    return this.players[(player.id - 1 + this.players.length) % this.players.length];
  }
  // 「手番終了後」の処理 / 手番交代
  @phase doAfterFinishedPlayerTurn(player: Player) {
    // 「手番終了後」の能力を処理
    this.doFieldAction(this.getNextPlayer(player));
  }
  // アイテム -------------------------------------------------------------
  // アイテムを得る
  @phase gainItem(player: Player, item: Item, checkMove2: boolean = true) {
    if (checkMove2 && !player.isAbleToGetSomething) {
      this.leftItems[item.category].push(item);
      player.choices = choices(`移動2なので${item.name}は得られなかった...`);
      return;
    }
    player.choices = choices(`${item.name}を入手！`, () => {
      player.items.push(item);
      // 星のかけら判定はフックしがいが無いのでここに書いちゃおう...
      if (player.items.filter(x => x.name === "星のかけら").length >= 2) {
        player.choices = this.getDiceChoices(player, "星のかけらが2個集まった！残機かボムが増える！", d => {
          this.sendBackItem(player, item);
          let another = player.items.filter(x => x.name === "星のかけら")[0];
          this.sendBackItem(player, another);
          if (d <= 2) player.choices = choices("残機が増えた！", () => player.heal());
          else player.choices = choices("ボムが増えた！", () => player.healBomb());
        }, false)
        // 1個得て2個減らすのだから 最大数チェックは大丈夫かと
        return;
      }
      this.checkActionHookA("アイテム獲得", player);
      // とりあえず5つまでしか持てないことにする
      if (player.items.length < 6) return;
      // アイテムを捨てる(呪いのアイテムは捨てられない！)
      player.choices = player.items.map(x =>
        new Choice(`これ以上持てない！${x.name}を捨てる`, () =>
          this.sendBackItem(player, x)
        ));
    })
  }
  @phase gainFriend(player: Player, friendName: FriendName) {
    if (this.leftFriends.every(x => x.name !== friendName)) {
      player.choices = choices(`${friendName}は既に居なかった...`);
    } else if (player.friend != null) {
      player.choices = choices(`既に${player.name}は${player.friend.name}を仲間にしていた...`)
    } else {
      player.friend = this.leftFriends.filter(x => x.name === friendName)[0];
      this.leftFriends = this.leftFriends.filter(x => x.name !== friendName);
      player.choices = choices(`${friendName}を仲間にした！ `);
    }
  }
  // 移動２でランダムにアイテムを失う
  @phase mayDropItem(player: Player) {
    if (player.items.length <= 0) return;
    player.choices = this.getDiceChoices(player, `${player.items.length}以下の出目でアイテムを失う！`, x => {
      let d = x - 1;
      if (d >= player.items.length) {
        player.choices = choices("アイテムは失わなかった");
        return;
      }
      let item = player.items[d];
      player.choices = choices(`${item.name}を失った...`, () => {
        this.sendBackItem(player, item)
      })
    }, false)
  }
  // アイテムを奪う
  @phase stealItem(player: Player, target: Player, item: Item) {
    this.checkActionHookAtoB("アイテム強奪", player, target);
    target.items = target.items.filter(x => x.id !== item.id);
    this.gainItem(player, item, false);
    player.choices = choices(`${item.name}を${target.name}から奪った！`)
  }
  // 戦闘 -----------------------------------------------------------------
  distributeCards(player: Player) {
    // 初期手札を渡す
    player.spellCards = [];
    _.range(6).forEach(_ => this.drawACard(player));
    // 地形カードで1ドロー
    let map = this.map[player.pos.x][player.pos.y];
    if (map && map.powerUp.addOneCard) {
      let addOne = map.powerUp.addOneCard;
      if (addOne.some(x => x === player.characterName))
        this.drawACard(player);
    }
    // 仲間ボーナス
    if (player.friend) this.drawACard(player);
  }
  // 戦闘を仕掛けた (戦闘を仕掛けた結果戦闘を拒否されてもターンを消費してしまう)
  @phase setupBattle(player: Player, target: Player) {
    // WARN: 戦闘回避無効化はまだ
    target.with("PC戦闘").choices = choices(`${player.name}に戦闘を仕掛けられた！`, () => {
      // 呼び寄せに注意
      this.distributeCards(player);
      this.distributeCards(target);
      // TODO: 弾幕カードがなければもう一度引き直す処理をしていない
      this.checkActionHookAtoB("戦闘開始", player, target)
      this.battle(player, target);
    });
  }
  // 戦闘が始まった
  @phase battle(player: Player, target: Player | NPCType, spellCard?: SpellCard) {
    let cans = player.spellCards.filter(sc =>
      player.spellCards.reduce((x, y) => x + y.star, 0) - sc.star >= sc.level
    ).filter(sc => sc.cardTypes.includes("弾幕") || sc.cardTypes.includes("武術"))
    let isNPC = target ? false : true; // NPC戦闘もここでやっちゃおう
    let isRevenge = spellCard ? true : false // 反撃もここでやっちゃおう
    let tag = isRevenge ? "反撃" : "攻撃";
    if (spellCard) { // 攻撃された
      cans = cans.filter(sc => sc.level > spellCard.level)
    }
    // 敗北
    let lose = () => {
      this.finishBattle(player, target);
      if (target instanceof Player) {
        if (isRevenge) this.win(target, player);
      } else {//NPCに敗北
        // WARN: 終了フラグを投げる順番がPC戦闘と異なる？
        if (player.items.length > 0) {
          player.choices = [new EventWrapper(this, player).randomDropItem(target + "に負けてしまった...")]
        } else {
          player.choices = choices(target + "に敗北してアイテムが無いので残機を失った！", () => {
            this.damaged(player);
          })
        }
      }
    }
    // NPCに勝利
    let winToNPC = () => {
      if (target instanceof Player) return;
      // WARN: 終了フラグを投げる順番がPC戦闘と異なる？
      player.choices = choices(target + "に勝利した！ ", () => {
        this.finishBattle(player, target);
        if (target !== "NPC幽霊") player.choices = [new EventWrapper(this, player).gainGoods(target + "に勝利したので")]
      })
    }
    // スペカを出せなかった...
    if (cans.length === 0) {
      player.choices = choices(`出せるスペルカードがなかった...${isRevenge ? "攻撃を食らった..." : ""}`, lose)
      return;
    }
    // スペカを出す！
    player.choices = cans.map(sc => {
      let leftCost = sc.level;
      let attack = () => {
        this.discardACard(player, sc);
        let attackLoop = () => {
          player.choices = player.spellCards.map(x =>
            new Choice(`${x.name}(${"☆".repeat(x.star)})をコストにする(残り:${leftCost})`, () => {
              leftCost -= x.star;
              this.discardACard(player, x);
              if (leftCost > 0) attackLoop();
              else if (target instanceof Player) this.battle(target, player, sc);
              else winToNPC();
            }))
        }
        attackLoop();
      }
      let view = `${sc.name}(LV${sc.level})`
      if (sc.level <= player.level) // 普通に攻撃
        return new Choice(`${view}で${tag}！`, attack)
      else { // 精神力チェック
        let tryLoop = (left: number) => {
          player.choices = this.getTwoDiceChoices(player, `${view}`, dice => {
            let d = dice.a + dice.b;
            if (d > player.mental) { // 失敗
              player.choices = choices(`精神力が足りなかった...${isRevenge ? "攻撃を食らった..." : ""}`, lose)
            } else if (left <= 1) { // 成功
              player.choices = choices(`${view}で${tag}！`, attack)
            } else { // まだまだやる
              player.choices = choices(`${view}を残り${left - 1}回の精神力チェックで頑張ってだす！`, () => { tryLoop(left - 1) })
            }
          })
        }
        let left = sc.level - player.level;
        return new Choice(`${view}を残り${left}回の精神力チェックで頑張ってだす！`, () => { tryLoop(left) })
      }
    })
    if (isRevenge) // 別に無理して試さなくてもいい
      player.choices.push(new Choice("反撃は諦める...", lose))
  }

  // 戦闘終了後
  @phase finishBattle(player: Player, target: Player | NPCType) {
    this.checkActionHookAtoB("戦闘終了", player, target instanceof Player ? target : player)
    this.usedSpellCards.push(...player.spellCards);
    player.spellCards = [];
    if (target instanceof Player) {
      this.usedSpellCards.push(...target.spellCards);
      target.spellCards = [];
      player.choices = choices(`${target.name}との戦闘が終わった`)
    } else player.choices = choices(`${target}との戦闘が終わった`)
  }
  // 戦闘勝利履歴を得た
  @phase win(player: Player, target: Player) {
    player.won.add(target.id);
    target.isAbleToAction = false;
    this.checkActionHookAtoB("戦闘勝利", player, target)
    this.phase(() => {
      player.choices = [
        ...(player.watched.has(target.id) ? [] :
          choices("戦闘勝利->正体確認", () => {
            this.watch(player, target);
            this.kick(player, target);
          })),
        // 必ずアイテムは奪えるとする(かっぱのリュックしかない時にNopにできてしまうので事前filterが居る)
        ...(target.items.map(item =>
          new Choice(`戦闘勝利 -> アイテム強奪(${item.name})`, () => {
            this.stealItem(player, target, item);
            this.kick(player, target);
          })
        )),
        new Choice("戦闘勝利->残機減少", () => {
          this.damaged(target, player);
        })
      ];
    })
  }
  // 蹴飛ばす
  @phase kick(player: Player, target: Player) {
    if (player.pos.x !== target.pos.x || player.pos.y !== target.pos.y) return;
    player.choices = player.pos.getNextTo()
      .filter(x => this.map[x.x][x.y] !== null)
      .map(pos => {
        let map = this.map[pos.x][pos.y];
        return new Choice(`キックする(${map ? map.name : "??"})`, () => {
          // 移動はするがそこの地形の効果は発動しない
          if (this.map[pos.x][pos.y] !== null) target.pos = pos;
        })
      });
    player.choices.push(new Choice("キックはしない"))
  }

  // その他行動 --------------------------------------------------------------
  // 正体を確認した
  @phase watch(player: Player, target: Player) {
    player.choices = choices(`${target.name}の正体を確認した！`, () => {
      player.watched.add(target.id);
      this.checkActionHookAtoB("正体確認", player, target)
    });
  }
  // 残機が減った
  // 残機減少無効は失敗している
  @phase damaged(player: Player, from?: Player, damage: number = 1) {
    player.life -= damage;
    player.isAbleToAction = false;
    player.pos = new Pos(-1, -1);
    if (player.life <= 0) {
      player.with("満身創痍").choices = choices(`${player.name}は満身創痍で敗北してしまった...`, () => {
        this.checkActionHookAByB("満身創痍", player, from);
        this.endGame();
      })
    } else {
      player.bomb = Math.max(2, player.bomb);
      player.choices = choices(`${damage}ダメージを受けた`);
      this.checkActionHookAByB("残機減少", player, from);
    }
  }
  // 土地を破壊した(誰がとかは無い)
  @phase destroyLand(pos: Pos, attrs: Attribute[]) {
    let heres = this.getPlayersAt(pos);
    let map = this.map[pos.x][pos.y];
    if (map) {
      this.leftLands.push(map);
      this.leftLands = _.shuffle(this.leftLands);
      this.map[pos.x][pos.y] = null;
      // NOTE: 誰が,とかはないので1Pが壊したことにする
      this.checkActionHookA("地形破壊", this.players[0]);
    }
    heres.forEach(x => {
      x.with(...attrs, "地形破壊").choices =
        choices("足元の地形が破壊された！", () => {
          this.damaged(x);
        })
    })
  }
  // 土地を開いた(移動はしない)
  @phase openRandomLand(player: Player, pos: Pos) {
    let { x, y } = pos;
    if (this.map[x][y] !== null) return; // 既に土地は開いている
    // 開いた(開いた瞬間選択肢が出るかもしれない)
    let land = this.leftLands[this.leftLands.length - 1];
    this.leftLands.pop();
    this.map[x][y] = land;
    this.checkActionHookA("土地を開く", player)
    player.choices = choices(`開けた土地は${land.name}だった！`);
  }
  // 土地に入る(土地を新たに開くことはしない)
  @phase enterLand(player: Player, pos: Pos) {
    player.pos = pos;
    let map = this.map[pos.x][pos.y];
    if (map === null) return;
    player.choices = choices(`${map.name}に入った！ `, () => {
      if (map === null) return;
      player.with(map.name, "地形効果").choices =
        map.whenEnter.bind(new EventWrapper(this, player))();
    })
  }
  // ゲームを終了する
  @phase endGame() {
    let i = 0;
    this.players.map(player => {
      player.choices = choices("ゲームは終了しました。", () => {
        i += 1;
        if (i !== this.players.length) return;
        this.actionStack = [];
      });
    })
  }
}
