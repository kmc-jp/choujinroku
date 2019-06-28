import { Character, getAllCharacters } from "./character";
import { Player, PlayerActionTag } from "./player";
import { Choice, message, UnaryFun } from "./choice";
import { FieldAction } from "./fieldaction";
import { Land, getLands } from "./land";
import { ItemCategoryDict, Item, getItemsData, ItemCategory } from "./item";
import * as _ from "underscore";
import { Pos, PosType } from "./pos";
import { SpellCard, getAllSpellCards } from "./spellcard";
import { TwoDice, dice, twoDice } from "./hook";

// アイテム / キャラ効果 / 地形効果 / 仲間 / 勝利条件 / 戦闘
type AnyAction = (() => any);

// デコレータ
function phase(target: Game, propertyKey: string, descriptor: PropertyDescriptor) {
  let original = descriptor.value;
  descriptor.value = function (this: Game, ...args: any[]) {
    this.temporaryActionStack.push(() => original.bind(this)(...args));
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
  usedSpellCards: SpellCard[] = [];
  actionStack: AnyAction[] = [];
  temporaryActionStack: AnyAction[] = [];
  turn: number = 0;
  leftCharacters: Character[];
  // 外部からのゲーム状態の更新はすべてこの関数を経由して行う
  // すなわち内部的には選択肢を選ぶことでのみゲームを進める
  public decide(playerId: number, choiceId: number) {
    let player = this.players[playerId];
    let choice = player.choices[choiceId];
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
    this.leftItems = getItemsData();
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
  private getMoveChoices(player: Player, poses: Pos[], tag: "移動1" | "移動2"): Choice<PosType>[] {
    // WARN 同一の場所を示す選択肢を生むかも
    return poses.map(p => new Choice(tag, { x: p.x, y: p.y }, () => {
      player.actions.push(tag);
      this.openRandomLand(player, p);
      this.enterLand(player, p);
      this.doFieldAction(player)
    }));
  }
  private parceFieldAction(player: Player, fieldActions: FieldAction[], tag: PlayerActionTag): Choice<any>[] {
    let result: Choice<any>[] = []
    for (let fieldAction of fieldActions) {
      let choices = fieldAction.bind(this)(player);
      for (let choice of choices) {
        choice.wrap((callback: UnaryFun<any>) => (x: any) => {
          player.actions.push(tag);
          callback(x);
        });
      }
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
  getDiceChoices(player: Player, tag: string, action: (x: { dice: number }) => any): Choice<{ dice: number }>[] {
    return [new Choice(tag + ":ダイス(1D)確定", { dice: dice() }, action)];
  }
  getTwoDiceChoices(player: Player, tag: string, action: (x: TwoDice) => any): Choice<TwoDice>[] {
    return [new Choice(tag + ":ダイス(2D)確定", twoDice(), action)];
  }
  pickACard(player: Player) {
    // 山札からカードを1枚引く
    if (this.leftSpellCards.length > 0) {
      let top = this.leftSpellCards[this.leftSpellCards.length - 1];
      this.leftSpellCards.pop();
      player.spellCards.push(top);
      return;
    }
    this.leftSpellCards = _.shuffle(this.usedSpellCards);
    this.pickACard(player);
  }

  // @phase の付いた関数は 全ての以前の選択が決定したのち(= 選択肢が空になったら)
  // 実行される。つまり他の選択肢に独立に実行できる。
  // よって player.choices を新たに追加することで選択肢を安全に作成できる。
  // 初期配置選択肢: 1Pから開始位置を選んでもらう -----------------------------
  @phase decideFirstPlace(player: Player) {
    player.choices = Pos.getOutSides().map(pos => new Choice("初期配置位置", pos.raw, () => {
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
  // 手番 ----------------------------------------------------------------
  // 手番行動を決定する
  @phase doFieldAction(player: Player) {
    this.turn++;
    // 行動不能や2回行動した場合はターン終了
    if (!player.isAbleToAction || player.actions.length >= 2) {
      this.finishPlayerTurn(player);
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
    player.choices = [
      new Choice("待機", {}, () => {
        player.actions.push("待機");
        player.waitCount++;
        this.finishPlayerTurn(player);
      })]
    // 移動1 / 移動2
    let moveTag: PlayerActionTag = "移動1";
    if (player.actions.includes("移動1")) moveTag = "移動2"
    if (!player.actions.includes("移動2")) {
      // 3手行動可能な時に移動1と移動2をしているかも
      player.choices.push(...this.getMoveChoices(player, player.pos.getNextTo(), moveTag))
    }
    // アイテム
    if (!player.actions.includes("アイテム")) {
      // アイテムを拾う
      let itemHere = this.itemsOnMap[player.pos.x][player.pos.y];
      if (itemHere !== null) {
        player.choices.push(new Choice("アイテムを拾う", {}, () => {
          player.actions.push("アイテム");
          let { x, y } = player.pos;
          this.itemsOnMap[x][y] = null;
          this.gainItem(player, itemHere!); // nullなわけないだろ！
          this.doFieldAction(player);
        }));
      }
      // アイテムのフィールド効果を発動
      for (let item of player.items) {
        player.choices.push(...this.parceFieldAction(player, item.fieldActions, "アイテム"))
      }
    }
    // 戦闘
    if (!player.actions.includes("戦闘")) {
      let versus = this.getPlayersAt(player.pos).filter(x => x.id !== player.id);
      player.choices.push(...versus.map(target => new Choice("戦闘", { target: target.name }, () => {
        player.actions.push("戦闘");
        this.setupBattle(player, target);
        this.doFieldAction(player);
      })));
    }
    // B自 / 特殊能力の使用
    if (!player.actions.includes("特殊能力の使用")) {
      player.choices.push(...this.parceFieldAction(player, player.fieldActions, "特殊能力の使用"))
    }
  }
  // 手番を終了する / お見合い
  @phase finishPlayerTurn(player: Player) {
    for (let p of this.players) {
      p.actions = [];
      p.isAbleToAction = true;
    }
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
        dices.set(p.id, x.dice);
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
      });
    });
  }
  // 「手番終了後」の処理 / 手番交代
  @phase doAfterFinishedPlayerTurn(player: Player) {
    // 「手番終了後」の能力を処理
    let nextId = (player.id + 1) % this.players.length;
    this.doFieldAction(this.players[nextId]);
  }
  // アイテム -------------------------------------------------------------
  // アイテムを得る
  @phase gainItem(player: Player, item: Item) {
    player.items.push(item);
    // とりあえず5つまでしか持てないことにする
    if (player.items.length < 6) return;
    player.choices = player.items.map(x =>
      new Choice("アイテムを捨てる", { item: x.name }, () =>
        this.discardItem(player, x)
      ));
  }
  // アイテムを捨てる(呪いのアイテムは捨てられない！)
  @phase discardItem(player: Player, item: Item) {
    player.items = player.items.filter(x => x.id !== item.id);
    this.leftItems[item.category].push(item);
  }
  // アイテムを落とす
  @phase dropItem(player: Player, item: Item) {
    // とりあえずね
    this.discardItem(player, item);
  }
  // アイテムを奪う
  @phase stealItem(player: Player, target: Player, item: Item) {
    target.items = target.items.filter(x => x.id !== item.id);
    this.gainItem(player, item);
  }
  // 戦闘 -----------------------------------------------------------------
  // 戦闘を仕掛けた WARN: 戦闘を仕掛けた結果戦闘を拒否されてもターンを消費してしまう
  @phase setupBattle(player: Player, target: Player) {
    player.choices = [new Choice(`${target.name} に戦闘を仕掛けた！`, {}, () => {
      // 呼び寄せに注意
      // 初期手札を渡す
      player.spellCards = [];
      target.spellCards = [];
      _.range(6).forEach(_ => this.pickACard(player));
      _.range(6).forEach(_ => this.pickACard(target));
      // 地形カードで1ドロー
      let map = this.map[player.pos.x][player.pos.y];
      if (map && map.powerUp.addOneCard) {
        let addOne = map.powerUp.addOneCard;
        if (addOne.some(x => x === player.characterName))
          this.pickACard(player);
        if (addOne.some(x => x === target.characterName))
          this.pickACard(target);
      }
      // TODO: 弾幕カードがなければもう一度引き直す処理をしていない
      this.attack(player, target, false);
    })];
  }
  // 戦闘が始まった
  @phase attack(player: Player, target: Player, isCounterAttack: boolean) {
    // 使うカードを決める(コストが足りるなら)
    // 使おうとする -> [成功,失敗]
    // なんやかんやあって最終的に勝敗を決定するが、ひとまず
    player.choices = [
      new Choice("戦闘勝利", {}, () => {
        this.finishBattle(player, target);
        this.win(player, target);
      }),
      new Choice("戦闘敗北", {}, () => {
        this.finishBattle(player, target);
        this.win(target, player);
      }),
      new Choice("戦闘は何も起きなかった", {}, () => {
        this.finishBattle(player, target);
      }),
    ];
  }
  // 戦闘終了後になにか処理があればそれをする
  @phase finishBattle(player: Player, target: Player) {
    this.usedSpellCards.push(...player.spellCards);
    this.usedSpellCards.push(...target.spellCards);
    player.spellCards = [];
    target.spellCards = [];
  }
  // 戦闘勝利履歴を得た
  @phase win(player: Player, target: Player) {
    player.won.add(target.id);
    target.isAbleToAction = false;
    player.choices = [
      ...(player.watched.has(target.id) ? [] : [
        new Choice("戦闘勝利->正体確認", {}, () => {
          this.watch(player, target);
          this.kick(player, target);
        })]),
      // 必ずアイテムは奪えるとする(かっぱのリュックしかない時にNopにできてしまうので事前filterが居る)
      ...(target.items.map(item =>
        new Choice("戦闘勝利->アイテム強奪", { item: item.name }, () => {
          this.stealItem(player, target, item);
          this.kick(player, target);
        })
      )),
      new Choice("戦闘勝利->残機減少", {}, () => {
        this.damaged(target, player);
      })
    ];
  }
  // 蹴飛ばす
  @phase kick(player: Player, target: Player) {
    if (player.pos.x !== target.pos.x || player.pos.y !== target.pos.y) return;
    player.choices = player.pos.getNextTo()
      .filter(x => this.map[x.x][x.y] !== null)
      .map(pos => new Choice("キックする", pos.raw, () => {
        // 移動はするがそこの地形の効果は発動しない
        if (this.map[pos.x][pos.y] !== null) target.pos = pos;
      }));
    player.choices.push(new Choice("キックはしない", {}, () => { }))
  }
  // その他行動 --------------------------------------------------------------
  // 正体を確認した
  @phase watch(player: Player, target: Player) {
    player.watched.add(target.id);
  }
  // 正体確認したのを忘れた
  @phase forgetWatch(player: Player, target: Player) {
    player.watched.delete(target.id)
  }
  // 勝利勝利履歴を忘れた
  @phase forgetWin(player: Player, target: Player) {
    player.won.delete(target.id);
  }
  // 残機が減った
  @phase damaged(player: Player, from?: Player, damage: number = 1) {
    player.life -= damage;
    player.isAbleToAction = false;
    player.pos = new Pos(-1, -1);
    if (player.life <= 0) {
      this.endGame();
      return;
    }
    player.bomb = Math.max(2, player.bomb);
    player.choices = [message(`${damage}ダメージを受けた`)];
  }
  // 土地を開いた(移動はしない)
  @phase openRandomLand(player: Player, pos: Pos) {
    let { x, y } = pos;
    if (this.map[x][y] !== null) return; // 既に土地は開いている
    // 開いた(開いた瞬間選択肢が出るかもしれない)
    let land = this.leftLands[this.leftLands.length - 1];
    this.leftLands.pop();
    this.map[x][y] = land;
  }
  // 土地に入る(土地を新たに開くことはしない)
  @phase enterLand(player: Player, pos: Pos) {
    player.pos = pos;
    let map = this.map[pos.x][pos.y];
    if (map === null) return;
    let attrs = player.with(map.name, "地形効果");
    player.choices = map.whenEnter.bind(map)(this, player, attrs);
  }
  // ゲームを終了する
  @phase endGame() {
    this.actionStack = [];
    for (let p of this.players) p.choices = [];
    alert("ゲームは正常に終了しました");
  }
}
