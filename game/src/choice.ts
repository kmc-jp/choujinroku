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
export function invalidate(attrs: (Attribute | Attribute[])[], when?: (p: Player) => boolean): ResistanceHook {
  return {
    when: attrs,
    choices(player: Player) {
      if (when && !when(player)) return [];
      return [message(attrs.join("/") + "を無効化！")];
    }
  }
}


export type Ailment =
  "幻覚" | "残機減少" | "呪い" | "能力低下" | "迷い"
  | "満身創痍" | "毒茸" | "飲み過ぎ" | "食あたり" | "手番休み"
  | "大ナマズ" | "地形破壊" | "落とし穴"
export type Factor =
  "地形効果" | "特殊能力" | "アイテム" | "妖精"
export type Attribute = Ailment | Factor | LandName
// 自分に対して嫌な効果が起きたとき、その属性耐性を持つHook

export type ResistanceHook = {
  force?: boolean, // 選択肢を選ぶのを強制する
  // WARN: この行動をした場合続けて他の行動を取れないのでは？？(例:空を飛んで避けようとして失敗したのでPADを使う)
  // [[A,B],[C],[D,E,F]] なら( (A and B) or C or (D and E and F))な状態を表す
  when: (Attribute | Attribute[])[],
  choices: (this: Game, player: Player, attributes?: Attribute[]) => Choice<any>[]
}


export type FieldAction = (this: Game, player: Player) => Choice<any>[];


// 勝利 / 敗北条件 Hook:
// A が B により タイプ: (B === undefined) なら他人の原因でなしに
export type HookAbyB<T> = {
  type: "AbyB";
  name: "残機減少" | "満身創痍"
  allowAisNotMe?: boolean;
  hook: (this: Game, a: Player, b?: Player) => T;
}
// A が B に タイプ : 戦闘勝利の場合は勝利要因のスペカを覚えておくこと
export type HookAtoB<T> = {
  type: "AtoB"
  name: "正体確認" | "戦闘勝利" | "アイテム強奪" | "アイテム譲渡" | "説教"
  allowAisNotMe?: boolean;
  hook: (this: Game, a: Player, b: Player) => T;
}
// A が タイプ :
export type HookA<T> = {
  type: "A"
  name: "移動" | "待機" | "土地破壊" | "残機上昇" | "アイテム獲得" | "土地を開く"
  allowAisNotMe?: boolean;
  hook: (this: Game, a: Player) => T;
}
export type ActionHook<T> = HookAbyB<T> | HookAtoB<T> | HookA<T>
export type WinLoseHook = ActionHook<boolean>
// その行動は追加で行ってもよい
export type SpecificActionHook = ActionHook<Choice<any>[]>
