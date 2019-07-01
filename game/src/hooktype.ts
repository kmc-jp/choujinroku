import { Game } from "./game";
import { Player } from "./player";
import { Choice, choices } from "./choice";
import { LandName, Land } from "./land";
import { SpellCard } from "./spellcard";
import { Item } from "./item";

export function dice(): number { return 1 + Math.floor(Math.random() * 6); }
export function twoDice(): TwoDice { return { a: dice(), b: dice() } }
export type TwoDice = { a: number, b: number };
export type Dice1D = { type: "1D", success: (this: Game, player: Player, dice: number) => boolean }
export type Dice2D = { type: "2D", success: (this: Game, player: Player, dice: TwoDice) => boolean }

// その属性をもつアクションが自分に対して行われた時に行われるHook
export type AttributeHook = {
  // この選択肢を選ぶのを強制する
  force?: boolean;
  // ボムが必要
  needBomb?: boolean;
  // ダイスの判定で成功したら使える
  needDice?: Dice1D | Dice2D;
  // 例「空を飛ぶ程度の能力」で無効化
  skillName?: string
  // [[A,B],[C],[D,E,F]] なら( (A and B) or C or (D and E and F))な状態を表す
  when: (Attribute | Attribute[])[];
  // 提示される選択肢(嫌なアクションを選ばなくてよいという点で無効化成功の選択肢があると嬉しい)
  choices: (this: Game, player: Player, attributes?: Attribute[]) => Choice[]
}

export type Ailment =
  "幻覚" | "呪い" | "能力低下" | "迷い" | "手番休み"
  | "毒茸" | "飲み過ぎ" | "食あたり"
  | "残機減少" | "満身創痍" // 満身創痍はダメージを食らって死亡してから復活するので注意(場外には行く？ )
  | "大ナマズ" | "地形破壊" | "落とし穴"
  | "PC戦闘" | "天狗警備隊"
  | "NPC戦闘" | NPCType | "戦闘回避" | "スキマ送り"
export type NPCType = "NPC妖怪" | "NPC神様" | "NPC妖精" | "NPC幽霊" | "NPCランダムキャラ"
export type Factor =
  "地形効果" | "特殊能力" | "アイテム" | "妖精" | "戦闘"
  | "トラップ" | "アクシデント" | "イベント"
// LandName での Factor による Ailment に対して発火
export type Attribute = LandName | Factor | Ailment

// Attribute を簡単な記法で付加してくれる
export class WithAttribute {
  player: Player;
  attrs: Attribute[];
  constructor(player: Player, ...attributes: Attribute[]) {
    this.player = player;
    this.attrs = attributes;
  }
  set choices(value: Choice[]) {
    this.player.choices = this.wrap(value);
  }
  wrap(value: Choice[]): Choice[] {
    return this.player.checkAttributeHooks(value, this.attrs);
  }
  with(...attributes: Attribute[]): WithAttribute {
    return new WithAttribute(this.player, ...this.attrs.concat(attributes));
  }
}


// 行動に対する Hook
export type HookBase = {
  allowAisNotMe?: boolean;
  skillName?: string;
  needBomb?: boolean;
}

// allowAisNotMe だと全員のその行動に対して hook される
// A が B により タイプ: (B === undefined) なら人のせいではなくそうなった
export type HookAbyBWhen = "残機減少" | "満身創痍"
export interface HookAbyB<T> extends HookBase {
  type: "AbyB";
  when: HookAbyBWhen[]
  hook: (this: Game, a: Player, b?: Player, me?: Player) => T;
}
// A が B に タイプ :
export type HookAtoBWhen = "正体確認" | "説教"
  | "戦闘開始" // AがBに/BがAに仕掛けた戦闘が始まる前 (手札補充など)
  | "戦闘終了" // AがBに/BがAに仕掛けた戦闘が終了した時(毒をばらまくなど) // a.id === b.id のときはNPC戦闘
export interface HookAtoB<T> extends HookBase {
  type: "AtoB"
  when: HookAtoBWhen[]
  hook: (this: Game, a: Player, b: Player, me: Player) => T;
}
export type HookAtoBWithItemWhen = "アイテム強奪" | "アイテム譲渡"
export interface HookAtoBWithItem<T> extends HookBase {
  type: "AtoBWithItem"
  when: HookAtoBWithItemWhen[]
  hook: (this: Game, a: Player, b: Player, item: Item, me: Player) => T;
}
// A が B に スペカで攻撃(or反撃)
export interface HookAttack<T> extends HookBase {
  type: "Attack";
  when: "Attack"[]
  hook: (this: Game, a: Player, b: Player | NPCType, spellCard: SpellCard, isRevenge: boolean, me?: Player) => T;
}
// A が B に スペカで攻撃された
export interface HookAttacked<T> extends HookBase {
  type: "Attacked";
  when: "Attacked"[]
  hook: (this: Game, a: Player, b: Player | NPCType, spellCard: SpellCard, me?: Player) => T;
}
// A が B に スペカで勝利
export interface HookAWinB<T> extends HookBase {
  type: "AwinB";
  when: "AwinB"[]
  hook: (this: Game, a: Player, b: Player | NPCType, spellCard: SpellCard, me?: Player) => T;
}


// A が タイプ
export type HookAWhen = "移動" | "待機" | "残機上昇" | "アイテム獲得";
export interface HookA<T> extends HookBase {
  type: "A"
  when: HookAWhen[]
  hook: (this: Game, a: Player, me: Player) => T;
}
// 地形をAが
export type HookALandWhen = "地形破壊" | "土地を開く";
export interface HookALand<T> extends HookBase {
  type: "ALand"
  when: HookALandWhen[]
  hook: (this: Game, a: Player, land: Land) => T;
}


export type ActionHookType = "AbyB" | "AtoB" | "Battle" | "A"
export type ActionHook<T> = HookAbyB<T> | HookAtoB<T> | HookAtoBWithItem<T> | HookA<T> | HookAttack<T> | HookAttacked<T> | HookAWinB<T> | HookALand<T>
// 勝利 / 敗北のフック
export type VictoryHook = ActionHook<boolean>
export type SpecificActionHook = ActionHook<Choice[]>
