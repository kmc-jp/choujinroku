import { Character } from "./character";
export type PlayerAction = "移動1" | "待機" | "移動2" | "戦闘"
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
  currentPos = { x: -1, y: -1 }; // 現在地(盤外:{-1,-1})
  id: number;
  watched: Set<number>; // 正体確認している？
  won: Set<number>  // 勝利している？
  items: Item[];
  choices: Choice[];
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
  toString(): string {
    return `${this.name}:
  x: ${this.currentPos.x}  y:${this.currentPos.y}
  キャラ: ${this.chara}
  勝利済み: ${this.won}
  正体確認: ${this.watched}`;
  }
}
