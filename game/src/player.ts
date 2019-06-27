import { Character } from "./character";
export type PlayerAction = "移動1" | "待機" | "移動2" | "戦闘" | "アイテム"
import { Choice } from "./choice";
import { Item } from "./item";

Set.prototype.toString = function () {
  let result = "{";
  this.forEach(x => result += x + ",");
  return result + "}";
}

export class Player {
  name: string;
  chara: Character;
  isAbleToAction: boolean; // 戦闘敗北などでターン続行不可能になった
  actions: PlayerAction[] = [];
  private privatePos = { x: -1, y: -1 }; // 現在地(盤外:{-1,-1})
  id: number;
  watched: Set<number>; // 正体確認している？
  won: Set<number>  // 勝利している？
  items: Item[];
  choices: Choice[];
  bomb: number = 2;
  remain: number = 3; //残機
  waitCount: number = 0;
  constructor(characterId: number, name: string, id: number) {
    this.chara = new Character(characterId);
    this.name = name;
    this.id = id;
    this.watched = new Set<number>();
    this.won = new Set<number>();
    this.isAbleToAction = true;
    this.items = [];
    this.choices = [];
  }
  get pos() { return this.privatePos; }
  set pos(value: { x: number, y: number }) {
    if (value.x !== this.privatePos.x || value.y !== this.privatePos.y)
      this.waitCount = 0;
    this.privatePos = value;
  }
  toString(): string {
    return `${this.name}:
  x: ${this.pos.x} ,y:${this.pos.y}
  ボム: ${this.bomb} , 残機: ${this.remain} , 待機: ${this.waitCount}
  キャラ: ${this.chara}
  勝利済み: ${this.won}
  正体確認: ${this.watched}
  アイテム: {${this.items.map(x => x.name).join(",")}}`;
  }
}
