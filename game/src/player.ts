import { Character } from "./character";
export type PlayerAction = "移動1" | "待機" | "移動2" | "戦闘" | "アイテム"
import { Choice } from "./choice";
import { Item } from "./item";
import { toString } from "./util";
import { LandName } from "./land";
export type Ailment =
  "幻覚" | "残機減少" | "呪い" | "能力低下" | "迷い"
  | "満身創痍" | "毒茸" | "飲み過ぎ" | "食あたり"
export type Factor =
  "地形効果" | "特殊能力" | "アイテム"
export type Attribute = Ailment | Factor | LandName

function setToArray<T>(set: Set<T>): T[] {
  let result: T[] = [];
  set.forEach(w => { result.push(w); });
  return result.sort();
}

Set.prototype.toString = function () {
  let result = "{";
  this.forEach(x => result += x + ",");
  return result + "}";
}

export class WithAttribute {
  player: Player;
  attrs: Attribute[];
  constructor(player: Player, ...attributes: Attribute[]) {
    this.player = player;
    this.attrs = attributes;
  }
  set choices(value: Choice<any> | Choice<any>[]) {
    this.player.choices = this.wrap(value);
  }
  wrap(value: Choice<any> | Choice<any>[]): Choice<any>[] {
    if (!(value instanceof Array)) value = [value];
    return this.player.checkWithAttributes(value, this.attrs);
  }
  with(...attributes: Attribute[]): WithAttribute {
    return new WithAttribute(this.player, ...this.attrs.concat(attributes));
  }
}

export class Player {
  name: string;
  character: Character;
  isAbleToAction: boolean; // 戦闘敗北などでターン続行不可能になった
  actions: PlayerAction[] = [];
  private privatePos = { x: -1, y: -1 }; // 現在地(盤外:{-1,-1})
  id: number;
  watched: Set<number>; // 正体確認している？
  won: Set<number>  // 勝利している？
  items: Item[];
  choices: Choice<any>[];
  bomb: number = 2;
  life: number = 3; //残機
  waitCount: number = 0;
  constructor(character: Character, name: string, id: number) {
    this.character = character;
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
  isAbleToGetSomething(): boolean {
    return !this.actions.includes("移動2");
  }
  with(...args: Attribute[]): WithAttribute {
    return new WithAttribute(this, ...args);
  }
  checkWithAttributes(choices: Choice<any>[], attrs: Attribute[]): Choice<any>[] {
    // 何もしない
    return choices;
  }
  // withAttributes(choices: Choice<any>[], ...args: (Factor | Ailment | LandName)[]): Choice<any>[] {
  //   // 誰も絶対に無効化できない(できるなら選択肢を返せば良い)
  //   return []
  // }
  get watchedArray(): number[] { return setToArray(this.watched); }
  get wonArray(): number[] { return setToArray(this.won); }
  toString(): string {
    return `${this.name}:
  x: ${this.pos.x} ,y:${this.pos.y}
  ボム: ${this.bomb} , 残機: ${this.life} , 待機: ${this.waitCount}
  キャラ: ${toString(this.character)}
  勝利済み: ${this.won}
  正体確認: ${this.watched}
  アイテム: {${this.items.map(x => x.name).join(",")}}`;
  }
}
