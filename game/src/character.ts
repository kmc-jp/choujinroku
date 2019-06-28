import { message, Choice } from "./choice";
import { AttributeHook, Attribute, SpecificActionHook, invalidate } from "./hook"
import { Game } from "./game";
import { Player } from "./player";
import { FieldAction } from "./fieldaction";

export type CharaName = "霊夢" | "魔理沙" | "ルーミア" | "アリス" | "チルノ" | "パチュリー" | "幽々子"
export type RaceName = "人間" | "種族不明"
export type RoleName = "主人公" | "妖怪" | "野次馬"
// ボムが必要な場合は関数内で処理すること
type CharacterBase = {
  name: CharaName;
  fullname: string;
  level: number; // レベル
  mental: number; // 精神力
  role: RoleName;
  race?: RaceName;
  attributeHooks?: AttributeHook[]; //
  fieldActions?: FieldAction[]; //　特殊能力の使用
  specificAdditionalActions?: SpecificActionHook[]; // 追加で*先に*行える特殊能力
  specificActions?: SpecificActionHook[]; // フックした時に他の選択肢を上書きして行われる能力
  id?: number;
}
export type Character = Required<CharacterBase>;

// 戦闘 Hook :
// "Attacked": 攻撃されて,反撃か防御か回避かを選ぶ時(1.選択肢を増やす 2.相手を弱体化する)
// "Attack"  : スペカ使用時
// "Avoid" : 回避(スペルカードを決めた)時
// スペカ使用時({弾幕/武術},{攻撃/反撃})
// 通常弾で攻撃時

export function getAllCharacters(): Character[] {
  let tmp: CharacterBase[] = [{
    name: "霊夢",
    fullname: "博麗 霊夢",
    level: 4,
    mental: 7,
    race: "人間",
    role: "主人公",
    attributeHooks: [
      invalidate(["能力低下"], p => p.items.some(x => x.name === "銘酒")),
      {
        when: ["残機減少", ["地形破壊", "落とし穴", "大ナマズ"]],
        needDice: { type: "1D", success(p: Player, d: number) { return d <= p.level; } },
        choices() { return [message("空を飛んで回避した！ ")]; }
      }
    ]
  }, {
    name: "魔理沙",
    fullname: "霧雨魔理沙",
    role: "主人公",
    level: 4,
    mental: 7,
    attributeHooks: [invalidate(["毒茸"])]
  }, {
    name: "ルーミア",
    fullname: "ルーミア",
    role: "妖怪",
    level: 2,
    mental: 7
  }, {
    name: "チルノ",
    fullname: "チルノ",
    role: "野次馬",
    level: 1,
    mental: 9,
    attributeHooks: [
      invalidate([["残機減少", "地形破壊"]]),
      invalidate(["妖精"]),
      invalidate(["呪い", "能力低下"], (_, a) => !a.includes("地形効果")),
    ]
  }, {
    name: "幽々子",
    fullname: "西行寺幽々子",
    role: "野次馬",
    level: 5,
    mental: 6,
    attributeHooks: [
      invalidate(["呪い", "能力低下"]),
      {
        force: true,
        when: ["毒茸", "食あたり", "飲み過ぎ"],
        choices(this: Game, player: Player) {
          return this.getTwoDiceChoices(player, "大食い亡霊", dice => {
            let success = dice.a + dice.b <= player.level
            if (!success) return [message("大食いをした！ ")]
            player.heal();
            return [message("大食いをして残機が1増えた！ ")]
          })
        }
      }
    ]
  }]
  let result: Character[] = [];
  tmp.forEach((x, i) => result.push({
    id: i,
    name: x.name,
    fullname: x.fullname,
    level: x.level,
    mental: x.mental,
    role: x.role,
    race: x.race || "種族不明",
    attributeHooks: x.attributeHooks || [],
    fieldActions: x.fieldActions || [],
    specificAdditionalActions: x.specificAdditionalActions || [],
    specificActions: x.specificActions || [],
  }));
  return result;
}
