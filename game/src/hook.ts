import { Game } from "./game";
import { Player } from "./player";
import { Choice, message } from "./choice";
import { LandName } from "./land";

export function dice(): number { return 1 + Math.floor(Math.random() * 6); }
export function twoDice(): TwoDice { return { a: dice(), b: dice() } }
export type TwoDice = { a: number, b: number };
export type Dice1D = { type: "1D", success: (this: Game, player: Player, dice: number) => boolean }
export type Dice2D = { type: "2D", success: (this: Game, player: Player, dice: TwoDice) => boolean }

// その属性をもつアクションが自分に対して行われた時に行われるHook
export type AttributeHook = {
  // この選択肢を選ぶのを強制する
  force?: boolean,
  // ダイスの判定結果に依る
  needDice?: Dice1D | Dice2D
  // [[A,B],[C],[D,E,F]] なら( (A and B) or C or (D and E and F))な状態を表す
  when: (Attribute | Attribute[])[],
  // WARN: この行動をした場合続けて他の行動を取れないのでは？？(例:空を飛んで避けようとして失敗したのでPADを使う)
  choices: (this: Game, player: Player, attributes?: Attribute[]) => Choice<any>[]
}
export type Ailment =
  "幻覚" | "残機減少" | "呪い" | "能力低下" | "迷い"
  | "満身創痍" | "毒茸" | "飲み過ぎ" | "食あたり" | "手番休み"
  | "大ナマズ" | "地形破壊" | "落とし穴"
export type Factor = "地形効果" | "特殊能力" | "アイテム" | "妖精" | "戦闘"
export type Attribute = Ailment | Factor | LandName
// AttributeHook の略記法で条件に合った時に効果を無効化する選択肢を提示する
export function invalidate(attrs: (Attribute | Attribute[])[], when?: (p: Player, a: Attribute[]) => boolean): AttributeHook {
  return {
    when: attrs,
    choices(player: Player, attributes?: Attribute[]) {
      if (when && !when(player, attributes ? attributes : [])) return [];
      return [message(attrs.join("/") + "を無効化！")];
    }
  }
}

// Attribute を簡単な記法で付加してくれる
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
    return this.player.checkAttributeHooks(value, this.attrs);
  }
  with(...attributes: Attribute[]): WithAttribute {
    return new WithAttribute(this.player, ...this.attrs.concat(attributes));
  }
}


// 行動に対する Hook
// allowAisNotMe だと全員のその行動に対して hook される
// A が B により タイプ: (B === undefined) なら他人の原因でなしに
export type HookAbyB<T> = {
  type: "AbyB";
  name: "残機減少" | "満身創痍"
  allowAisNotMe?: boolean;
  hook: (this: Game, a: Player, b?: Player) => T;
}
// A が B に タイプ : ところで戦闘勝利の場合は勝利要因のスペカを覚えておくこと(LV6のスペカで勝利、などのため)
export type HookAtoB<T> = {
  type: "AtoB"
  name: "正体確認" | "戦闘勝利" | "アイテム強奪" | "アイテム譲渡" | "説教"
  allowAisNotMe?: boolean;
  hook: (this: Game, a: Player, b: Player) => T;
}
// A が タイプ
export type HookA<T> = {
  type: "A"
  name: "移動" | "待機" | "土地破壊" | "残機上昇" | "アイテム獲得" | "土地を開く"
  allowAisNotMe?: boolean;
  hook: (this: Game, a: Player) => T;
}
export type ActionHook<T> = HookAbyB<T> | HookAtoB<T> | HookA<T>
export type WinLoseHook = ActionHook<boolean>
export type SpecificActionHook = ActionHook<Choice<any>[]>
