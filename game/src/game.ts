import { Character, getAllCharacters } from "./character";
import { Player, PlayerAction } from "./player";
import { Choice, message, UnaryFun } from "./choice";
import { Land, getLands } from "./land";
import { ItemCategoryDict, Item, getItemsData, ItemCategory } from "./item";
import * as _ from "underscore";

// アイテム / キャラ効果 / 地形効果 / 仲間 / 勝利条件 / 戦闘
type AnyAction = (() => any);
export type Pos = { x: number, y: number }
export type TwoDice = Pos;
function phase(target: Game, propertyKey: string, descriptor: PropertyDescriptor) {
  let original = descriptor.value;
  descriptor.value = function (this: Game, ...args: any[]) {
    this.temporaryActionStack.push(() => original.bind(this)(...args));
  }
  // @phase の付いた関数はそのまま一度スタックに退避される。
  // 割り込みが発生して、その全てが終了したのちに実行される。
  // ローカルな処理を順序に沿って行いたい時は game.phase 関数でくるむ。
  // phase の中では選択肢はその中で作成されたものだけになることが保証される。
  // よって player.choices を独立に考えて好きにいじってよい。たいていいじる。
  // いじらないと player.choices は空になっている。
  // いじらなくてもよいが,その場合は特にプレイヤーへの選択肢/messageナシに処理が進むことを意味する。
}

// 現在はブラウザで動いているが、サーバーで動いてもいい感じになってほしい気持ちで書く
export class Game {
  players: Player[];
  map: (Land | null)[][];
  itemsOnMap: (Item | null)[][];
  leftLands: Land[];
  leftItems: ItemCategoryDict;
  actionStack: AnyAction[] = [];
  temporaryActionStack: AnyAction[] = [];
  turn: number = 0;
  leftCharacters: Character[];
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
    this.map = _.range(6).map(() => _.range(6).map(() => null));
    this.leftLands = _.shuffle(getLands());
    this.leftItems = getItemsData();
    this.itemsOnMap = this.placeItemsOnMap();
    this.decideFirstPlace(this.players[0]);
    this.normalizeActionStack();
  }
  placeItemsOnMap(): (Item | null)[][] {
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
  decide(playerId: number, choiceId: number) {
    let player = this.players[playerId];
    let choice = player.choices[choiceId];
    player.choices = [];
    choice.invoke();
    this.normalizeActionStack();
  }
  normalizeActionStack() {
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
  dice(): number { return 1 + Math.floor(Math.random() * 6); }
  twoDice() { return [this.dice(), this.dice()] }
  getPlayersAt(pos: Pos): Player[] {
    if (this.isOutOfLand(pos)) return [];
    return this.players
      .filter(x => x.pos.x === pos.x && x.pos.y === pos.y);
  }
  isOutOfLand(p: Pos): boolean {
    return p.x < 0 || p.x >= 6 || p.y < 0 || p.y >= 6;
  }
  getNextTo(pos: Pos): Pos[] {
    // 上下左右
    return [{ x: -1, y: 0 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }].map(x => ({
      x: x.x + pos.x, y: x.y + pos.y
    })).filter(x => !this.isOutOfLand(x));
  }
  getPlayersNextTo(pos: Pos): Player[] {
    return this.players.filter(x => 1 === Math.abs(x.pos.x - pos.x) + Math.abs(x.pos.y - pos.y))
  }
  getOutSides(): Pos[] {
    let result: Pos[] = [];
    for (let x = 0; x < 6; x++) result.push({ x: x, y: 0 });
    for (let x = 0; x < 6; x++) result.push({ x: x, y: 5 });
    for (let y = 1; y < 5; y++) result.push({ x: 0, y: y });
    for (let y = 1; y < 5; y++) result.push({ x: 5, y: y });
    return result;
  }
  getDiceChoices(player: Player, tag: string, action: (x: { dice: number }) => any): Choice<{ dice: number }>[] {
    let dice = this.dice();
    return [new Choice(tag + ":ダイス(1D)確定", { dice: dice }, action)];
  }
  getTwoDiceChoices(player: Player, tag: string, action: (x: TwoDice) => any): Choice<Pos>[] {
    let [x, y] = this.twoDice();
    return [new Choice(tag + ":ダイス(2D)確定", { x, y }, action)];
  }
  phase(fun: () => any) { this.temporaryActionStack.push(fun); }

  getMoveChoices(player: Player, poses: Pos[], tag: "移動1" | "移動2"): Choice<Pos>[] {
    return poses.map(p => new Choice(tag, { x: p.x, y: p.y }, () => {
      player.actions.push(tag);
      player.pos = p;
      this.openRandomLand(p);
      this.phase(() => {
        if (player.pos.x !== p.x || player.pos.y !== p.y) return;
        let map = this.map[p.x][p.y];
        if (map === null) return;
        let attrs = player.with(map.name, "地形効果");
        player.choices = map.whenEnter.bind(map)(this, player, attrs);
      })
      this.processPlayerTurn(player)
    }));
  }
  @phase decideFirstPlace(player: Player) {
    // 1Pから開始位置(x:[0,5],y:[0,5])を選んでもらう
    // 初期配置選択肢
    player.choices = this.getOutSides().map(x => new Choice("初期配置位置", x, x => {
      player.pos = { x: +x.x, y: +x.y };
      if (player.id < this.players.length - 1) {
        this.decideFirstPlace(this.players[player.id + 1]);
        return;
      }
      this.players.map(x => this.openRandomLand(x.pos));
      this.processPlayerTurn(this.players[0]);
    }));
  }
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
        this.damaged(target);
      })
    ];
  }
  @phase kick(player: Player, target: Player) {
    if (player.pos.x !== target.pos.x || player.pos.y !== target.pos.y) return;
    player.choices = this.getNextTo(player.pos)
      .filter(x => this.map[x.x][x.y] !== null)
      .map(pos => new Choice("キックする", pos, () => {
        // 移動はするがそこの地形の効果は発動しない
        if (this.map[pos.x][pos.y] !== null) target.pos = pos;
      }));
    player.choices.push(new Choice("キックはしない", {}, () => { }))
  }
  @phase watch(player: Player, target: Player) {
    player.watched.add(target.id);
  }
  @phase forgetWin(player: Player, target: Player) {
    player.won.delete(target.id);
  }
  @phase forgetWatch(player: Player, target: Player) {
    player.watched.delete(target.id)
  }
  // 手番
  @phase doAfterFinishedPlayerTurn(player: Player) {
    // 「手番終了後」の能力を処理
    let nextId = (player.id + 1) % this.players.length;
    this.processPlayerTurn(this.players[nextId]);
  }

  @phase finishPlayerTurn(player: Player) {
    for (let p of this.players) {
      p.actions = [];
      p.isAbleToAction = true;
    }
    let sames = this.getPlayersAt(player.pos);
    if (this.isOutOfLand(player.pos) || sames.length <= 1) {
      this.doAfterFinishedPlayerTurn(player);
      return;
    }
    // 同じマスにいるキャラクターとのお見合い判定
    let dices = new Map<number, number>();
    sames.forEach(p => {
      p.choices = this.getDiceChoices(p, "お見合い", x => {
        dices.set(p.id, x.dice);
        if (dices.size < sames.length) return;
        for (let p of sames) {
          sames.filter(x => x.id !== p.id)
            .filter(x => dices.get(x.id) === dices.get(p.id))
            .forEach(x => this.watch(p, x));
        }
        this.doAfterFinishedPlayerTurn(player);
      });
    });
  }
  @phase processPlayerTurn(player: Player) {
    this.turn++;
    if (!player.isAbleToAction || player.actions.length >= 2) {
      this.finishPlayerTurn(player);
      return;
    }
    let moveTag: PlayerAction = player.actions.includes("移動1") ? "移動2" : "移動1";
    if (this.isOutOfLand(player.pos)) {
      // 既に行動済みな場合で盤外に不慮の事故で行ってしまった場合は手番はそこで終了
      if (player.actions.length >= 1) return this.finishPlayerTurn(player);
      let outsides = this.getOutSides().filter(x => this.map[x.x][x.y] !== null);
      // 全て行けない場合は特別にどこでも開けられる
      if (outsides.length === 0) outsides = this.getOutSides();
      player.choices = this.getMoveChoices(player, outsides, moveTag);
      return;
    }
    // WARN 同一の選択肢を生むかも
    let nextTos = this.getNextTo(player.pos)
    let versus = this.getPlayersAt(player.pos).filter(x => x.id !== player.id);
    if (player.actions.includes("戦闘")) versus = [];
    let itemOnMap = this.itemsOnMap[player.pos.x][player.pos.y];
    let alreadyItemAction = player.actions.includes("アイテム");
    if (alreadyItemAction) itemOnMap = null;
    player.choices = [
      new Choice("待機", {}, () => {
        player.actions.push("待機");
        player.waitCount++;
        this.finishPlayerTurn(player);
      }),
      ...this.getMoveChoices(player, nextTos, moveTag),
      ...versus.map(p =>
        new Choice("戦闘", { target: p.name }, () => {
          player.actions.push("戦闘");
          this.startBattle(player, p);
          this.processPlayerTurn(player);
        }))];
    if (itemOnMap !== null) {
      player.choices.push(
        new Choice("アイテムを拾う", {}, () => {
          player.actions.push("アイテム");
          let { x, y } = player.pos;
          this.itemsOnMap[x][y] = null;
          if (itemOnMap !== null) this.gainItem(player, itemOnMap);
          this.processPlayerTurn(player);
        }));
    }
    // アイテムのフィールド効果を発動
    if (!alreadyItemAction) {
      for (let item of player.items) {
        if (item.fieldAction === null) continue;
        let choices = item.fieldAction.bind(item)(this, player);
        for (let choice of choices) {
          choice.wrap((callback: UnaryFun<any>) => (x: any) => {
            player.actions.push("アイテム");
            callback(x);
          });
        }
        player.choices.push(...choices);
      }
    }
  }
  // アイテム
  @phase gainItem(player: Player, item: Item) {
    player.items.push(item);
    // とりあえず5つまでしか持てないことにする
    if (player.items.length < 6) return;
    player.choices = player.items.map(x =>
      new Choice("アイテムを捨てる", { item: x.name }, () =>
        this.discardItem(player, x)
      ));
  }
  // 捨てる(呪いのアイテムは捨てられない！)
  @phase discardItem(player: Player, item: Item) {
    player.items = player.items.filter(x => x.id !== item.id);
    this.leftItems[item.category].push(item);
  }
  // 落とす
  @phase dropItem(player: Player, item: Item) {
    // とりあえずね
    this.discardItem(player, item);
  }
  // 奪う
  @phase stealItem(player: Player, target: Player, item: Item) {
    target.items = target.items.filter(x => x.id !== item.id);
    this.gainItem(player, item);
  }
  // 戦闘
  @phase startBattle(player: Player, target: Player) {
    player.choices = [
      new Choice("戦闘勝利", {}, () => {
        this.win(player, target);
      }),
      new Choice("戦闘敗北", {}, () => {
        this.win(target, player);
      }),
      message("戦闘は何も起きなかった")
    ];
  }
  // 残機が減った
  @phase damaged(player: Player, damage: number = 1) {
    player.life -= damage;
    player.isAbleToAction = false;
    player.pos = { x: -1, y: -1 };
    if (player.life <= 0) {
      this.gameEnd();
      return;
    }
    player.bomb = Math.max(2, player.bomb);
    player.choices = [message(`${damage}ダメージを受けた`)];
  }
  // ゲーム終了判定
  @phase gameEnd() {
    this.actionStack = [];
    for (let p of this.players) p.choices = [];
    alert("ゲームは正常に終了しました");
  }
  // マップ
  @phase openRandomLand(pos: Pos) {
    let { x, y } = pos;
    // 開いた(開いた瞬間選択肢が出るかもしれない)
    if (this.map[x][y] !== null) return; // 既に存在している
    let land = this.leftLands[this.leftLands.length - 1];
    this.leftLands.pop();
    this.map[x][y] = land;
  }
}
