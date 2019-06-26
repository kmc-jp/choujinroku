import { Character } from "./character";
export type PlayerAction = "移動1" | "待機" | "移動2"

export class Player {
  name: string;
  chara: Character;
  actions: PlayerAction[] = [];
  currentLandPos = { x: -1, y: -1 }; // 現在地(盤外:{-1,-1})
  id: number;
  watched: { [key: number]: boolean } = {} // 正体確認している？
  won: { [key: number]: boolean } = {} // 勝利している？
  constructor(characterId: number, name: string, id: number) {
    this.chara = new Character(characterId);
    this.name = name;
    this.id = id;
  }
  toString(): string {
    return `${this.name}:
  x: ${this.currentLandPos.x}  y:${this.currentLandPos.y}
  ${this.chara}`;
  }
}
