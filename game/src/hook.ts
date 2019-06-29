import { Game } from "./game";
import { Player } from "./player";
import { Choice, message } from "./choice";
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
  | "PC戦闘" | "NPC戦闘" | "戦闘回避" | "スキマ送り"
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
      return [message(skillName + "で無効化！")];
    }
  }
}
export function invalidate1D(skillName: string, attrs: (Attribute | Attribute[])[], success: (p: Player, dice: number) => boolean): AttributeHook {
  return {
    skillName: skillName,
    when: attrs,
    needDice: { type: "1D", success(p: Player, dice: number) { return success(p, dice); } },
    choices(player: Player, attributes?: Attribute[]) {
      return [message(skillName + "で無効化成功！")];
    }
  }
}
export function invalidate2D(skillName: string, attrs: (Attribute | Attribute[])[], success: (p: Player, dice: TwoDice) => boolean): AttributeHook {
  return {
    skillName: skillName,
    when: attrs,
    needDice: { type: "2D", success(p: Player, dice: TwoDice) { return success(p, dice); } },
    choices(player: Player, attributes?: Attribute[]) {
      return [message(skillName + "で無効化成功！")];
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
// allowAisNotMe だと全員のその行動に対して hook される
// A が B により タイプ: (B === undefined) なら人のせいではなくそうなった
export type HookAbyB<T> = {
  type: "AbyB";
  when: ("残機減少" | "満身創痍")[]
  hook: (this: Game, a: Player, b?: Player, me?: Player) => T;
  allowAisNotMe?: boolean;
  skillName?: string;
  needBomb?: boolean;
}
// A が B に タイプ :
// WARN: ところで戦闘勝利の場合は勝利要因のスペカを覚えておくこと(LV6のスペカで勝利、などのため)
export type HookAtoB<T> = {
  type: "AtoB"
  when: ("正体確認" | "アイテム強奪" | "アイテム譲渡" | "説教"
    | "戦闘開始" // AがBに/BがAに仕掛けた戦闘が始まる前 (手札補充など)
    | "初撃"    // 最初にAがBに攻撃する時 (特殊能力で攻撃 / 特殊能力で相手を弱体化)
    | "戦闘終了" // AがBに/BがAに仕掛けた戦闘が終了した時(毒をばらまくなど)
    | "戦闘勝利")[] // AがBに勝利したとき
  hook: (this: Game, a: Player, b: Player, me: Player) => T;
  allowAisNotMe?: boolean;
  skillName?: string;
  needBomb?: boolean;
}
// A が B に C のスペカで タイプ
export type HookBattle<T> = {
  type: "Battle";
  when: "Attack"  // A が B に C で攻撃する時
  | "Attacked";   // A が B に C で攻撃された時
  hook: (this: Game, a: Player, b: Player, c: SpellCard) => T;
  skillName?: string;
  needBomb?: boolean;
}
// A が タイプ
export type HookA<T> = {
  type: "A"
  when: ("移動" | "待機" | "地形破壊" | "残機上昇" | "アイテム獲得" | "アイテム損失" | "土地を開く")[]
  hook: (this: Game, a: Player, me: Player) => T;
  allowAisNotMe?: boolean;
  skillName?: string;
  needBomb?: boolean;
}
export type ActionHook<T> = HookAbyB<T> | HookAtoB<T> | HookA<T> | HookBattle<T>
export type WinLoseHook = ActionHook<boolean>
export type SpecificActionHook = ActionHook<Choice[]>

// 条件を満たしたら手札1枚ドロー
export function drawACard(skillName: string, success: (a: Player, b: Player, c: SpellCard) => boolean): SpecificActionHook {
  return {
    type: "Battle",
    when: "Attack",
    skillName: skillName,
    hook(this: Game, a: Player, b: Player, c: SpellCard): Choice[] {
      if (!success(a, b, c)) return [];
      return [new Choice(skillName + ":手札1枚ドロー", () => {
        this.drawACard(a);
      })];
    }
  }
}
// xxでxxを持ってxxターン待機して勝利
export function waitToWin(where: LandName, items: ItemName[], waitCount: number): WinLoseHook {
  return {
    type: "A",
    when: ["待機"],
    hook(this: Game, player: Player) {
      let land = player.currentLand;
      if (land === null) return false;
      if (land.name !== where) return false;
      for (let item of items) {
        if (player.getWaitCount(item) < waitCount) return false;
      }
      return true;
    }
  }
}
// xxで誰かがxxを持ってx人以上集まって勝利
export function gatherToWin(where: LandName, item: ItemName, memberCount: number): WinLoseHook {
  return {
    type: "A",
    when: ["移動"],
    allowAisNotMe: true,
    hook(this: Game, _: Player, me: Player) {
      let land = me.currentLand;
      if (land === null) return false;
      if (land.name !== where) return false;
      let heres = this.getPlayersAt(me.pos);
      if (heres.length < memberCount) return false;
      return heres.some(x => x.items.some(i => i.name === item));
    }
  }
}
// 全員の正体を確認し、全ての ignoreCharas を除く Role のキャラクターに戦闘で勝つ
export function allWatchAndAllWinToWin(requireWinRole: RoleName, ignoreCharas: CharaName[]): WinLoseHook {
  return {
    type: "AtoB",
    when: ["正体確認", "戦闘勝利"],
    hook(this: Game, player: Player) {
      for (let other of this.getOthers(player)) {
        if (!player.watched.has(other.id)) return false;
        if (other.role !== requireWinRole) continue;
        if (ignoreCharas.includes(other.characterName)) continue;
        if (!player.won.has(other.id)) return false;
      }
      return true;
    }
  }
}
