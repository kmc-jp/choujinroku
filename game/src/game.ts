import { Character, getAllCharacters } from "./character";
import { Player, PlayerAction } from "./player";
import { Choice, ChoiceType } from "./choice";
import { Land, getLands } from "./land";
import { ItemCategoryDict, Item, getItemsData, ItemCategory } from "./item";
import * as _ from "underscore";

// アイテム / キャラ効果 / 地形効果 / 仲間 / 勝利条件 / 戦闘
type AnyAction = (() => any);
type Pos = { x: number, y: number }
// 現在はブラウザで動いているが、サーバーで動いてもいい感じになってほしい気持ちで書く
export class Game {
  players: Player[];
  map: (Land | null)[][];
  itemsOnMap: (Item | null)[][];
  leftLands: Land[];
  leftItems: ItemCategoryDict;
  actionStack: AnyAction[];
  turn: number;
  leftCharacters: Character[];
  static tryToStartGame(ids: number[]): Game | null {
    if (ids.length <= 1) return null; // 一人プレイは不可能
    if (ids.length !== _.uniq(ids).length) return null; // 同じキャラは不可能
    if (ids.some(x => x < 0 || x >= getAllCharacters().length)) return null; // 変なキャラは不可能
    return new Game(ids);
  }
  private constructor(ids: number[]) {
    this.leftCharacters = getAllCharacters();
    this.players = ids.map((x, i) => new Player(this.leftCharacters[x], `${i + 1}P`, i));
    this.leftCharacters = this.leftCharacters.filter(x => this.players.every(y => x.id !== y.character.id));
    this.map = _.range(6).map(() => _.range(6).map(() => null));
    this.leftLands = _.shuffle(getLands());
    this.turn = 0;
    this.actionStack = [];
    this.leftItems = getItemsData();
    this.itemsOnMap = this.placeItemsOnMap();
    this.askFirstPlace(this.players[0]);
    this.consumeActionStackSafety();
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
    this.consumeActionStackSafety();
  }
  consumeActionStackSafety() {
    while (this.players.every(x => x.choices.length === 0)) {
      let f = this.actionStack.pop();
      if (f) f();
      else break;
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

  // 同時に別の選択肢が現れてほしくない行動が複数ある場合フェイズ毎に実行する
  byPhase(...actions: AnyAction[]) {
    // 一つしか無い時は予約する必要はない。
    // stackなので順番はロジックと逆にして保存する。
    for (let action of actions.reverse()) this.actionStack.push(action);
  }
  askFirstPlace(player: Player) {
    // 1Pから開始位置(x:[0,5],y:[0,5])を選んでもらう
    // 初期配置選択肢
    player.choices = this.getOutSides().map(x => new Choice("初期配置位置", x, x => {
      player.pos = { x: +x.x, y: +x.y };
      if (player.id < this.players.length - 1) {
        this.askFirstPlace(this.players[player.id + 1]);
        return;
      }
      this.byPhase(
        ...this.players.map(x => () => this.openRandomLand(x.pos)),
        () => this.askPlayerTurn(this.players[0])
      )
    }));
  }
  win(player: Player, target: Player) {
    player.won.add(target.id);
    target.isAbleToAction = false;
    player.choices = [
      ...(player.watched.has(target.id) ? [] : [
        new Choice("戦闘勝利->正体確認", {}, () => {
          this.byPhase(
            () => this.watch(player, target),
            () => this.kick(player, target));
        })]),
      // 必ずアイテムは奪えるとする(かっぱのリュックしかない時にNopにできてしまうので事前filterが居る)
      ...(target.items.map(item =>
        new Choice("戦闘勝利->アイテム強奪", { item: item.name }, () => {
          this.byPhase(
            () => this.stealItem(player, target, item),
            () => this.kick(player, target));
        })
      )),
      new Choice("戦闘勝利->残機減少", {}, () => {
        this.damaged(target);
      })
    ];
  }
  kick(player: Player, target: Player) {
    if (player.pos.x !== target.pos.x || player.pos.x !== target.pos.y) return;
    player.choices = this.getNextTo(player.pos)
      .filter(x => this.map[x.x][x.y] !== null)
      .map(x => new Choice("キックする", {}, () => {
        // 移動はするがそこの地形の効果は発動しない
        if (this.map[x.x][x.y] !== null) target.pos = x;
      }));
    player.choices.push(new Choice("キックはしない", {}, () => { }))
  }
  watch(player: Player, target: Player) {
    player.watched.add(target.id);
  }
  forgetWin(player: Player, target: Player) {
    player.won.delete(target.id);
  }
  forgetWatch(player: Player, target: Player) {
    player.watched.delete(target.id)
  }
  // 手番
  doAfterFinishedPlayerTurn(player: Player) {
    // 「手番終了後」の能力を処理
    let nextId = (player.id + 1) % this.players.length;
    this.askPlayerTurn(this.players[nextId]);
  }
  getDiceChoices(player: Player, tag: string, action: (x: { dice: number }) => any): Choice<{ dice: number }>[] {
    let dice = this.dice();
    return [new Choice(tag + ":ダイス(1D)確定", { dice: dice }, action)];
  }
  getTwoDiceChoices(player: Player, tag: string, action: (x: Pos) => any): Choice<Pos>[] {
    let [x, y] = this.twoDice();
    return [new Choice(tag + ":ダイス(2D)確定", { x, y }, action)];
  }
  finishPlayerTurn(player: Player) {
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
        let matching: AnyAction[] = [];
        for (let p of sames) {
          sames.filter(x => x.id !== p.id)
            .filter(x => dices.get(x.id) === dices.get(p.id))
            .forEach(x => matching.push(() => this.watch(p, x)));
        }
        this.byPhase(
          ...matching,
          () => this.doAfterFinishedPlayerTurn(player));
      });
    });
  }
  getMoveChoices(player: Player, poses: Pos[], tag: "移動1" | "移動2"): Choice<Pos>[] {
    return poses.map(p =>
      new Choice(tag, { x: p.x, y: p.y }, () => {
        player.actions.push(tag);
        player.pos = p;
        this.byPhase(
          () => this.openRandomLand(p),
          () => {
            if (player.pos.x !== p.x || player.pos.y !== p.y) return;
            let map = this.map[p.x][p.y];
            if (map === null) return;
            let attrs = player.with(map.name, "地形効果");
            player.choices = attrs.wrap(map.whenEnter.bind(map)(this, player, attrs));
          },
          () => this.askPlayerTurn(player),
        );
      }))
  }
  askPlayerTurn(player: Player) {
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
          this.byPhase(
            () => this.startBattle(player, p),
            () => this.askPlayerTurn(player));
        }))];
    if (itemOnMap !== null) {
      player.choices.push(
        new Choice("アイテムを拾う", {}, () => {
          player.actions.push("アイテム");
          let { x, y } = player.pos;
          this.itemsOnMap[x][y] = null;
          this.byPhase(
            () => {
              if (itemOnMap !== null) this.gainItem(player, itemOnMap)
            },
            () => this.askPlayerTurn(player))
        }));
    }
    // アイテムのフィールド効果を発動
    if (!alreadyItemAction) {
      for (let item of player.items) {
        if (item.fieldAction === null) continue;
        let choices = item.fieldAction.bind(item)(this, player);
        for (let choice of choices) {
          let pre = choice.callback;
          choice.callback = (x: any) => {
            player.actions.push("アイテム");
            pre(x);
          };
        }
        player.choices.push(...choices);
      }
    }
  }
  // アイテム
  gainItem(player: Player, item: Item) {
    player.items.push(item);
    // とりあえず5つまでしか持てないことにする
    if (player.items.length < 6) return;
    player.choices = player.items.map(
      x => new Choice("アイテムを捨てる", { item: x.name },
        () => this.discardItem(player, x)
      ));
  }
  // 捨てる(呪いのアイテムは捨てられない！)
  discardItem(player: Player, item: Item) {
    player.items = player.items.filter(x => x.id !== item.id);
    this.leftItems[item.category].push(item);
  }
  // 落とす
  dropItem(player: Player, item: Item) {
    // とりあえずね
    this.discardItem(player, item);
  }
  // 奪う
  stealItem(player: Player, target: Player, item: Item) {
    target.items = target.items.filter(x => x.id !== item.id);
    this.gainItem(player, item);
  }
  // 戦闘
  startBattle(player: Player, target: Player) {
    player.choices = [
      new Choice("戦闘勝利", {}, () => {
        this.win(player, target);
      }),
      new Choice("戦闘敗北", {}, () => {
        this.win(target, player);
      }),
      new Choice("戦闘は何も起きなかった", {}, () => {
      }),
    ];
  }
  // 残機が減った
  damaged(player: Player) {
    player.life -= 1;
    player.isAbleToAction = false;
    player.pos = { x: -1, y: -1 };
    if (player.life <= 0) {
      this.gameEnd();
      return;
    }
    player.bomb = Math.max(2, player.bomb);
  }
  // ゲーム終了判定
  gameEnd() {
    this.actionStack = [];
    this.players.forEach(p => p.choices = []);
    alert("ゲームは正常に終了しました");
  }
  // マップ
  openRandomLand(pos: Pos) {
    let { x, y } = pos;
    // 開いた(開いた瞬間選択肢が出るかもしれない)
    if (this.map[x][y] !== null) return; // 既に存在している
    let land = this.leftLands[this.leftLands.length - 1];
    this.leftLands.pop();
    this.map[x][y] = land;
  }
}
