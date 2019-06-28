import { ResistanceHook, message, Choice, Attribute, SpecificActionHook, invalidate, FieldAction } from "./choice";
import { Game } from "./game";
import { Player } from "./player";

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
  resistanceHooks?: ResistanceHook[]; // 耐性 (飲みすぎて休み、みたいに悪化の可能性もある)
  fieldActions?: FieldAction[]; //　特殊能力の使用
  specificAdditionalActions?: SpecificActionHook[]; // 追加で*先に*行える特殊能力
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
    resistanceHooks: [
      invalidate(["能力低下"], p => p.items.some(x => x.name === "銘酒")),
      {
        when: ["残機減少", ["地形破壊", "落とし穴", "大ナマズ"]],
        choices(player: Player) {
          return this.getDiceChoices(player, "空を飛んで残機減少無効化", d => {
            if (d.dice <= player.level) return [message("残機減少無効化成功！ ")];
            return [new Choice("残機減少無効化失敗", {}, () => { this.damaged(player); })]
          });
        }
      }]
  }, {
    name: "魔理沙",
    fullname: "霧雨魔理沙",
    role: "主人公",
    level: 4,
    mental: 7,
    resistanceHooks: [invalidate(["毒茸"])]
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
    resistanceHooks: [
      invalidate([["残機減少", "地形破壊"]]),
      invalidate(["妖精"]),
      {
        when: ["呪い", "能力低下"],
        choices(p: Player, a?: Attribute[]): Choice<any>[] {
          if (!a || a.includes("地形効果")) return [];
          return [message("キャラクターの効果で無効にした！ ")];
        }
      }
    ]
  }, {
    name: "幽々子",
    fullname: "西行寺幽々子",
    role: "野次馬",
    level: 5,
    mental: 6,
    resistanceHooks: [
      invalidate(["呪い", "能力低下"]),
      {
        force: true,
        when: ["毒茸", "食あたり", "飲み過ぎ"],
        choices(this: Game, player: Player) {
          return this.getTwoDiceChoices(player, "大食い亡霊", dice => {
            let success = dice.x + dice.y <= player.level
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
    resistanceHooks: x.resistanceHooks || [],
    fieldActions: x.fieldActions || [],
    specificAdditionalActions: x.specificAdditionalActions || [],
  }));
  return result;
}
