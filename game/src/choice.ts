import { LandName } from "./land";
import { Game } from "./game";
import { Player } from "./player";

export type ChoiceType = { [key: string]: number | string };
export type UnaryFun<T> = (x: T) => any;
export class Choice<T extends ChoiceType> {
  tag: string;
  elem: T;
  private callback: UnaryFun<T>;
  constructor(tag: string, elem: T, callback: (x: T) => any) {
    this.tag = tag;
    this.elem = elem;
    this.callback = callback;
  }
  wrap(fun: (x: UnaryFun<T>) => UnaryFun<T>) {
    let original = this.callback;
    this.callback = fun(original);
  }
  invoke() { this.callback(this.elem); }
  toString(): string {
    let result: string[] = [];
    for (let key in this.elem)
      if (key !== "tag") result.push(key + ":" + this.elem[key]);
    return this.tag + ":{" + result.join(",") + "}";
  }
}
export function message(text: string): Choice<{}> {
  return new Choice(text, {}, () => { })
}
export function nop(): Choice<any>[] { return [] }
export type Ailment =
  "幻覚" | "残機減少" | "呪い" | "能力低下" | "迷い"
  | "満身創痍" | "毒茸" | "飲み過ぎ" | "食あたり" | "手番休み"
  | "大ナマズ" | "地形破壊" | "落とし穴"
export type Factor =
  "地形効果" | "特殊能力" | "アイテム" | "妖精"
export type Attribute = Ailment | Factor | LandName
export type Hook = {
  force?: boolean, // 選択肢を選ぶのを強制する
  when: (Attribute | Attribute[])[],
  choices: (this: Game, player: Player, attributes?: Attribute[]) => Choice<any>[]
}
