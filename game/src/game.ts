import { Character, characterDatus } from "./character";
import { Player, PlayerAction } from "./player";
import { Choice, ChoiceType } from "./choice";
import { Land } from "./land";
import { ItemCategoryDict, Item, getItemsData, ItemCategory, ItemData } from "./item";
import * as _ from "underscore";

type AnyAction = (() => any);
// 現在はブラウザで動いているが、サーバーで動いてもいい感じになってほしい気持ちで書く
export class Game {
  players: Player[];
  map: (Land | null)[][];
  itemsOnMap: (ItemData | null)[][];
  leftLands: Land[];
  leftItems: ItemCategoryDict<ItemData>;
  actionStack: AnyAction[];
  turn: number;
  static tryToStartGame(ids: number[]): Game | null {
    if (ids.length <= 1) return null; // 一人プレイは不可能
    if (ids.length !== _.uniq(ids).length) return null; // 同じキャラは不可能
    if (ids.some(x => x < 0 || x >= characterDatus.length)) return null; // 変なキャラは不可能
    return new Game(ids);
  }
  private constructor(ids: number[]) {
    this.players = ids.map((x, i) => new Player(x, `${i + 1}P`, i));
    this.map = _.range(6).map(() => _.range(6).map(() => null));
    this.leftLands = _.shuffle(_.range(36).map(i => new Land(i)));
    this.turn = 0;
    this.actionStack = [];
    this.leftItems = getItemsData();
    this.itemsOnMap = this.placeItemsOnMap();
    this.askFirstPlace(this.players[0]);
    this.consumeActionStackSafety();
  }
  placeItemsOnMap(): (ItemData | null)[][] {
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
  consumeActionStackSafety() {
    while (this.players.every(x => x.choices.length === 0)) {
      let f = this.actionStack.pop();
      if (f) f();
      else break;
    }
  }
  isOutOfLand(p: { x: number, y: number }): boolean {
    return p.x < 0 || p.x >= 6 || p.y < 0 || p.y >= 6;
  }
  dice(): number { return 1 + Math.floor(Math.random() * 6); }
  twoDice() { return [this.dice(), this.dice()] }
  getPlayersAt(pos: { x: number, y: number }): Player[] {
    if (this.isOutOfLand(pos)) return [];
    return this.players
      .filter(x => x.currentPos.x === pos.x && x.currentPos.y === pos.y);
  }
  // 同時に別の選択肢が現れてほしくない行動が複数ある場合予約する。
  // 一つしか無い時はreserveする必要はない。
  // stackなので順番はロジックと逆にして保存する。
  reserve(...actions: AnyAction[]) {
    for (let action of actions.reverse()) this.actionStack.push(action);
  }
  askFirstPlace(player: Player) {
    // 初期配置選択肢
    // 1Pから開始位置(x:[0,5],y:[0,5])を選んでもらう
    let xys: { x: number, y: number }[] = [];
    for (let x = 0; x < 6; x++) xys.push({ x: x, y: 0 });
    for (let x = 0; x < 6; x++) xys.push({ x: x, y: 5 });
    for (let y = 1; y < 5; y++) xys.push({ x: 0, y: y });
    for (let y = 1; y < 5; y++) xys.push({ x: 5, y: y });
    player.choices = xys.map(x => new Choice("初期配置位置", x, x => {
      player.currentPos = { x: +x.x, y: +x.y };
      if (player.id < this.players.length - 1) {
        this.askFirstPlace(this.players[player.id + 1]);
        return;
      }
      this.reserve(
        ...this.players.map(x => () => this.openRandomLand(x.currentPos)),
        () => this.askPlayerTurn(this.players[0])
      )
    }));
  }
  win(player: Player, target: Player) {
    player.won.add(target.id);
  }
  watch(player: Player, target: Player) {
    player.watched.add(target.id);
  }
  doAfterFinishedPlayerTurn(player: Player) {
    // 「手番終了後」の能力を処理
    let nextId = (player.id + 1) % this.players.length;
    this.askPlayerTurn(this.players[nextId]);
  }
  finishPlayerTurn(player: Player) {
    for (let p of this.players) {
      p.actions = [];
      p.isAbleToAction = true;
    }
    let sames = this.getPlayersAt(player.currentPos);
    if (!this.isOutOfLand(player.currentPos) && sames.length <= 1) {
      this.doAfterFinishedPlayerTurn(player);
      return;
    }
    // 同じマスにいるキャラクターとのお見合い判定
    let dices = new Map<number, number>();
    sames.forEach(p => {
      let dice = this.dice();
      p.choices = [new Choice("お見合い:ダイス確定", { dice: dice }, x => {
        dices.set(p.id, dice);
        if (dices.size < sames.length) return;
        let matching: AnyAction[] = [];
        for (let p of sames) {
          sames.filter(x => x.id !== p.id)
            .filter(x => dices.get(x.id) === dices.get(p.id))
            .forEach(x => matching.push(() => this.watch(p, x)));
        }
        this.reserve(
          ...matching,
          () => this.doAfterFinishedPlayerTurn(player));
      })];
    });
  }
  askPlayerTurn(player: Player) {
    this.turn++;
    if (!player.isAbleToAction || player.actions.length >= 2) {
      this.finishPlayerTurn(player);
      return;
    }
    if (this.isOutOfLand(player.currentPos)) {
      // TODO: 場外にいるキャラは一生入れないのじゃ...！
      return;
    }
    let moveTag: PlayerAction = player.actions.includes("移動1") ? "移動2" : "移動1";
    // WARN 同一の選択肢を生むかも
    let nextTos = [{ x: -1, y: 0 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }].map(x => ({
      x: x.x + player.currentPos.x, y: x.y + player.currentPos.y
    })).filter(x => !this.isOutOfLand(x));
    let versus = this.getPlayersAt(player.currentPos).filter(x => x.id !== player.id);
    if (player.actions.includes("戦闘")) versus = [];
    let itemOnMap = this.itemsOnMap[player.currentPos.x][player.currentPos.y];
    if (player.actions.includes("アイテム")) itemOnMap = null;
    player.choices = [
      new Choice("待機", {}, x => {
        player.actions.push("待機");
        this.finishPlayerTurn(player);
      }),
      ...nextTos.map(p =>
        new Choice(moveTag, { x: p.x, y: p.y }, x => {
          player.actions.push(moveTag);
          let pos = { x: +x.x, y: +x.y };
          player.currentPos = pos;
          this.reserve(
            () => this.openRandomLand(pos),
            () => this.askPlayerTurn(player),
          );
        })),
      ...versus.map(p =>
        new Choice("戦闘", { target: p.name }, x => {
          player.actions.push("戦闘");
          this.reserve(
            () => this.startBattle(player, p),
            () => this.askPlayerTurn(player));
        })),
      ...(itemOnMap === null ? [] : [
        new Choice("アイテムを拾う", {}, _ => {
          player.actions.push("アイテム");
          let { x, y } = player.currentPos;
          this.itemsOnMap[x][y] = null;
          this.reserve(
            () => {
              if (itemOnMap !== null) this.gainItem(player, new Item(itemOnMap))
            },
            () => this.askPlayerTurn(player),
          );
        })])
    ];
  }
  gainItem(player: Player, item: Item) {
    player.items.push(item);
    // TODO:とりあえず無限に持てる
  }
  startBattle(player: Player, target: Player) {
    player.choices = [
      new Choice("戦闘勝利", {}, x => {
        this.win(player, target);
      }),
      new Choice("戦闘敗北", {}, x => {
        this.win(target, player);
      }),
      new Choice("戦闘は何も起きなかった", {}, x => {
      }),
    ];
  }
  openRandomLand(pos: { x: number, y: number }) {
    let { x, y } = pos;
    // 開いた(開いた瞬間選択肢が出るかもしれない)
    if (this.map[x][y] !== null) return; // 既に存在している
    let land = this.leftLands[this.leftLands.length - 1];
    this.leftLands.pop();
    this.map[x][y] = land;
  }
}
