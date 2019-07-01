import { Game } from "./game";
import { Player } from "./player";
import { Choice, choices } from "./choice";
import { LandName } from "./land";
import { SpellCard } from "./spellcard";
import { ItemName } from "./item";
import { RoleName, CharaName } from "./character";

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
// AttributeHook の略記法で条件に合った時に効果を無効化する選択肢を提示する
export function invalidate(skillName: string, attrs: (Attribute | Attribute[])[], when?: (p: Player, a: Attribute[]) => boolean): AttributeHook {
  return {
    skillName: skillName,
    when: attrs,
    choices(player: Player, attributes?: Attribute[]) {
      if (when && !when(player, attributes ? attributes : [])) return [];
      return choices(skillName + "で無効化！");
    }
  }
}

//アイテムを消費して無効化
export function useAndInvalidate(itemName: ItemName, attrs: (Attribute | Attribute[])[], when?: (p: Player, a: Attribute[]) => boolean): AttributeHook {
  return {
    skillName: itemName,
    when: attrs,
    choices(player: Player, attributes?: Attribute[]) {
      if (when && !when(player, attributes ? attributes : [])) return [];
      return choices(itemName + "を消費して無効化！", () => {
        let items = player.items.filter(x => x.name === itemName);
        if (items.length <= 0) return;
        let item = items[0]
        this.sendBackItem(player, item);
      });
    }
  }
}

export function invalidate1D(skillName: string, attrs: (Attribute | Attribute[])[], success: (p: Player, dice: number) => boolean): AttributeHook {
  return {
    skillName: skillName,
    when: attrs,
    needDice: { type: "1D", success(p: Player, dice: number) { return success(p, dice); } },
    choices(player: Player, attributes?: Attribute[]) {
      return choices(skillName + "で無効化成功！");
    }
  }
}

export function invalidate2D(skillName: string, attrs: (Attribute | Attribute[])[], success: (p: Player, dice: TwoDice) => boolean): AttributeHook {
  return {
    skillName: skillName,
    when: attrs,
    needDice: { type: "2D", success(p: Player, dice: TwoDice) { return success(p, dice); } },
    choices(player: Player, attributes?: Attribute[]) {
      return choices(skillName + "で無効化成功！");
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
// WARN: ところで戦闘勝利の場合は勝利要因のスペカを覚えておくこと(LV6のスペカで勝利、などのため)
export type HookAtoBWhen = "正体確認" | "アイテム強奪" | "アイテム譲渡" | "説教"
  | "戦闘開始" // AがBに/BがAに仕掛けた戦闘が始まる前 (手札補充など)
  | "戦闘終了" // AがBに/BがAに仕掛けた戦闘が終了した時(毒をばらまくなど) // a.id === b.id のときはNPC戦闘
  | "戦闘勝利"//  AがBに勝利したとき
export interface HookAtoB<T> extends HookBase {
  type: "AtoB"
  when: HookAtoBWhen[]
  hook: (this: Game, a: Player, b: Player, me: Player) => T;
}

// A が B に C のスペカで タイプ
export type HookBattleWhen =
  "Attack"  // A が B に C で攻撃する時
  | "Attacked";   // A が B に C で攻撃された時
export interface HookBattle<T> extends HookBase {
  type: "Battle";
  when: HookBattleWhen[]
  hook: (this: Game, a: Player, b: Player, c: SpellCard, me: Player) => T;
}
// A が タイプ
export type HookAWhen = "移動" | "待機" | "地形破壊" | "残機上昇" | "アイテム獲得" | "土地を開く";
export interface HookA<T> extends HookBase {
  type: "A"
  when: HookAWhen[]
  hook: (this: Game, a: Player, me: Player) => T;
}
export type ActionHookType = "AbyB" | "AtoB" | "Battle" | "A"
export type ActionHook<T> = HookAbyB<T> | HookAtoB<T> | HookA<T> | HookBattle<T>
// 勝利 / 敗北のフック
export type VictoryHook = ActionHook<boolean>
export type SpecificActionHook = ActionHook<Choice[]>
