import { Character } from "./character";

export type ChoiceType = { [key: string]: number | string };
export class Choice {
  title = "";
  elem: ChoiceType = {};
  private callback: (x: ChoiceType) => any;
  constructor(title: string, elem: ChoiceType, callback: (x: ChoiceType) => any) {
    this.title = title;
    this.elem = elem;
    this.callback = callback;
  }
  invoke() { this.callback(this.elem); }
  toString(): string {
    let result: string[] = [];
    for (let key in this.elem) result.push(key + ":" + this.elem[key]);
    return this.title + ":{" + result.join(",") + "}";
  }
}

export class Player {
  name: string;
  chara: Character;
  currentLandPos = { x: -1, y: -1 }; // 現在地(盤外:{-1,-1})
  constructor(characterId: number, name: string) {
    this.chara = new Character(characterId);
    this.name = name;
  }
  toString(): string {
    return `${this.name}:
  x: ${this.currentLandPos.x}  y:${this.currentLandPos.y}
  ${this.chara}`;
  }
  isOutOfLand(): boolean {
    let { x, y } = this.currentLandPos;
    return x < 0 || x >= 6 || y < 0 || y >= 6;
  }
}
