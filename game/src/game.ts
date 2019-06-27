import { Character, characterDatus } from "./character";
import { Player, PlayerAction } from "./player";
import { Choice, ChoiceType } from "./choice";
import { Land } from "./land";
import { ItemCategoryDict, Item, getItemsData, ItemCategory, ItemData } from "./item";
import * as _ from "underscore";

function reserveAction(target: Game, propertyKey: string, descriptor: PropertyDescriptor) {
  let original = descriptor.value;
  descriptor.value = function (this: Game, ...args: any[]) {
    this.actionStack.push(() => original.bind(this)(...args));
  }
}


// 現在はブラウザで動いているが、サーバーで動いてもいい感じになってほしい気持ちで書く
export class Game {
  players: Player[];
  map: (Land | null)[][];
  itemsOnMap: (ItemData | null)[][];
  leftLands: Land[];
  leftItems: ItemCategoryDict<ItemData>;
  actionStack: (() => any)[];
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
    this.askFirstPlace(0);
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
  askFirstPlace(playerId: number) {
    // 初期配置選択肢
    // 1Pから開始位置(x:[0,5],y:[0,5])を選んでもらう
    let xys: { x: number, y: number }[] = [];
    for (let x = 0; x < 6; x++) xys.push({ x: x, y: 0 });
    for (let x = 0; x < 6; x++) xys.push({ x: x, y: 5 });
    for (let y = 1; y < 5; y++) xys.push({ x: 0, y: y });
    for (let y = 1; y < 5; y++) xys.push({ x: 5, y: y });
    this.players[playerId].choices = xys.map(x => new Choice("初期配置位置", x, x => {
      this.players[playerId].currentPos = { x: +x.x, y: +x.y };
      if (playerId < this.players.length - 1) {
        this.askFirstPlace(playerId + 1);
        return;
      }
      // 1Pからターンを開始
      this.askPlayerTurn(0);
      for (let player of this.players) {
        this.openRandomLand(player.currentPos.x, player.currentPos.y);
      }
    }));
  }
  isOutOfLand(p: { x: number, y: number }): boolean {
    return p.x < 0 || p.x >= 6 || p.y < 0 || p.y >= 6;
  }
  reserve(f: () => any) {
    this.actionStack.push(f);
  }
  dice(): number { return 1 + Math.floor(Math.random() * 6); }
  twoDice() { return [this.dice(), this.dice()] }
  getPlayersAt(pos: { x: number, y: number }): Player[] {
    if (this.isOutOfLand(pos)) return [];
    return this.players
      .filter(x => x.currentPos.x === pos.x && x.currentPos.y === pos.y);
  }
  win(playerId: number, targetId: number) {
    this.players[playerId].won.add(targetId);
  }
  watch(playerId: number, targetId: number) {
    this.players[playerId].watched.add(targetId);
  }
  doAfterFinishedPlayerTurn(playerId: number) {
    // 「手番終了後」の能力を処理
    let next = (playerId + 1) % this.players.length;
    this.askPlayerTurn(next);
  }
  @reserveAction
  finishPlayerTurn(playerId: number) {
    for (let p of this.players) {
      p.actions = [];
      p.isAbleToAction = true;
    }
    let player = this.players[playerId];
    let sames = this.getPlayersAt(player.currentPos);
    if (!this.isOutOfLand(player.currentPos) && sames.length <= 1) {
      this.doAfterFinishedPlayerTurn(playerId);
      return;
    }
    // 同じマスにいるキャラクターとのお見合い判定
    let dices = new Map<number, number>();
    sames.forEach(p => {
      let dice = this.dice();
      p.choices = [new Choice("お見合い:ダイス確定", { dice: dice }, x => {
        dices.set(p.id, dice);
        if (dices.size < sames.length) return;
        // 予めスタックに積んでおく
        this.doAfterFinishedPlayerTurn(playerId);
        for (let p of sames) {
          sames.filter(x => x.id !== p.id)
            .filter(x => dices.get(x.id) === dices.get(p.id))
            .forEach(x => this.watch(p.id, x.id));
        }
      })];
    });
  }
  @reserveAction
  askPlayerTurn(playerId: number) {
    this.turn++;
    let player = this.players[playerId];
    if (!player.isAbleToAction || player.actions.length >= 2) {
      this.finishPlayerTurn(playerId);
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
        this.finishPlayerTurn(playerId);
      }),
      ...nextTos.map(p =>
        new Choice(moveTag, { x: p.x, y: p.y }, x => {
          player.actions.push(moveTag);
          this.askPlayerTurn(playerId);
          this.openRandomLand(+x.x, +x.y);
          player.currentPos = { x: +x.x, y: +x.y };
        })),
      ...versus.map(p =>
        new Choice("戦闘", { target: p.name }, x => {
          player.actions.push("戦闘");
          // 予めセット
          this.askPlayerTurn(playerId);
          this.startBattle(playerId, p.id);
        })),
      ...(itemOnMap === null ? [] : [
        new Choice("アイテムを拾う", {}, _ => {
          player.actions.push("アイテム");
          let { x, y } = player.currentPos;
          if (itemOnMap === null) return console.assert(itemOnMap !== null);// そんなことはないはず
          this.itemsOnMap[x][y] = null;
          this.askPlayerTurn(playerId);
          this.gainItem(playerId, new Item(itemOnMap));
        })])
    ];
  }
  @reserveAction
  gainItem(playerId: number, item: Item) {
    let player = this.players[playerId];
    player.items.push(item);
    // TODO:とりあえず無限に持てる
  }
  @reserveAction
  startBattle(playerId: number, targetId: number) {
    let player = this.players[playerId];
    let target = this.players[targetId];
    player.choices = [
      new Choice("戦闘勝利", {}, x => {
        this.win(playerId, targetId);
      }),
      new Choice("戦闘敗北", {}, x => {
        this.win(targetId, playerId);
      }),
      new Choice("戦闘は何も起きなかった", {}, x => {
      }),
    ];
  }
  @reserveAction
  openRandomLand(x: number, y: number) {
    // 開いた(開いた瞬間選択肢が出るかもしれない)
    if (this.map[x][y] !== null) return; // 既に存在している
    let land = this.leftLands[this.leftLands.length - 1];
    this.leftLands.pop();
    this.map[x][y] = land;
  }
}
