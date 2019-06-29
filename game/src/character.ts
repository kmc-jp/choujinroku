import { Choice, choices } from "./choice";
import { AttributeHook, Attribute, SpecificActionHook, invalidate, invalidate1D, WinLoseHook, invalidate2D, drawACard, waitToWin, gatherToWin, allWatchAndAllWinToWin } from "./hook"
import { Game } from "./game";
import { Player } from "./player";
import { FieldAction } from "./fieldaction";
import { SpellCardName, SpellCard } from "./spellcard";
import { Item } from "./item";

export type CharaName = "霊夢" | "魔理沙" | "ルーミア" | "アリス" | "チルノ" | "パチュリー" | "幽々子" | "紫"
export type RaceName = "人間" | "種族不明"
export type RoleName = "主人公" | "妖怪" | "野次馬"
// ボムが必要な場合は関数内で処理すること
type CharacterBase = {
  name: CharaName;
  fullname: string;
  level: number; // レベル
  mental: number; // 精神力
  spellCard: SpellCardName;
  role: RoleName;
  race?: RaceName;
  attributeHooks?: AttributeHook[]; //
  fieldActions?: FieldAction[]; //　特殊能力の使用
  specificActions?: SpecificActionHook[]; // フックした時に他の選択肢より先に行える能力
  whenWin?: WinLoseHook[];
  whenLose?: WinLoseHook[];
  id?: number;
  // アイテム所持数の数え方が特殊なキャラ用
  howToCountItems?: ((this: Game, player: Player) => number) | null;
  // アイテムを捨てられないキャラ用
  canDiscardItem?: ((this: Game, player: Player, item: Item) => boolean) | null
}
export type Character = Required<CharacterBase>;


export function getAllCharacters(): Character[] {
  // 書き方サンプル
  let 大食い: AttributeHook = {
    force: true,
    when: ["毒茸", "食あたり", "飲み過ぎ"],
    choices(this: Game, player: Player) {
      return this.getTwoDiceChoices(player, "大食い", dice => {
        let success = dice.a + dice.b <= player.level
        if (!success) return choices("大食いをした！ ")
        player.heal();
        return choices("大食いをして残機が1増えた！ ")
      })
    }
  };
  // 敗北条件は知らん！
  let tmp: CharacterBase[] = [{
    name: "霊夢",
    fullname: "博麗 霊夢",
    spellCard: "夢想封印",
    role: "主人公",
    level: 4,
    mental: 7,
    race: "人間",
    // まだ: G常ダイス反転 / B戦(夢想天生)
    attributeHooks: [
      invalidate("楽園の素敵な巫女", ["能力低下"], p => p.items.some(x => x.name === "銘酒")),
      invalidate1D("空を飛ぶ程度の能力",
        [["残機減少", "地形破壊"], ["残機減少", "落とし穴"], ["残機減少", "大ナマズ"]],
        (p, d) => d <= p.level),
      invalidate2D("楽園の素敵な巫女", ["満身創痍"], (p, d) => d.a + d.b <= p.mental)
    ],
    specificActions: [
      drawACard("楽園の素敵な巫女", (a, b, c) =>
        a.watched.has(b.id) && b.role === "妖怪" && c.cardTypes.includes("弾幕")),
    ],
    whenWin: [
      allWatchAndAllWinToWin("妖怪", ["紫"]),
      waitToWin("博麗神社", ["神社の御札"], 3),
      gatherToWin("博麗神社", "銘酒", 3)
    ]
  }, {
    name: "魔理沙",
    fullname: "霧雨魔理沙",
    spellCard: "マスタースパーク",
    role: "主人公",
    level: 4,
    mental: 7,
    // まだ: 戦闘 / 強奪 ...
    attributeHooks: [
      invalidate("魔法を使う程度の能力", ["毒茸"]),
      invalidate2D("努力家", ["満身創痍"], (p, d) => d.a + d.b <= p.mental)
    ],
    howToCountItems() { return 0; }, // アイテムは無限に持てる
    canDiscardItem() { return false; } // アイテムを捨てられない
  }, {
    name: "ルーミア",
    fullname: "ルーミア",
    role: "妖怪",
    spellCard: "ディマーケイション",
    level: 2,
    mental: 7
  }, {
    name: "チルノ",
    fullname: "チルノ",
    role: "野次馬",
    spellCard: "アイシクルフォール",
    level: 1,
    mental: 9,
    attributeHooks: [
      invalidate("さいきょーの妖精", [["残機減少", "地形破壊"]]),
      invalidate("さいきょーの妖精", ["妖精"]),
      invalidate("さいきょーの妖精", ["呪い", "能力低下"], (_, a) => !a.includes("地形効果")),
    ]
  }]
  // 紫は書いていないけどスキマ送り耐性を忘れないでね！
  // 文はアクシデント6「他者が盛大に転んだマスに居合わせれば勝利、自分が盛大に転んだマスに他者が居たら敗北となる。」を忘れないで！
  let result: Character[] = [];
  tmp.forEach((x, i) => result.push({
    id: i,
    name: x.name,
    fullname: x.fullname,
    level: x.level,
    mental: x.mental,
    spellCard: x.spellCard,
    role: x.role,
    race: x.race || "種族不明",
    attributeHooks: x.attributeHooks || [],
    fieldActions: x.fieldActions || [],
    whenWin: x.whenWin || [],
    whenLose: x.whenLose || [],
    specificActions: x.specificActions || [],
    howToCountItems: x.howToCountItems || null,
    canDiscardItem: x.canDiscardItem || null
  }));
  return result;
}
