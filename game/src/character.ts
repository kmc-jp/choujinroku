import { Choice, choices } from "./choice";
import { AttributeHook, Attribute, SpecificActionHook, VictoryHook, NPCType } from "./hooktype"
import { drawACard } from "./specificaction"
import * as Victory from "./victory";
import { invalidate, invalidate1D, invalidate2D } from "./attributehook";
import { Game } from "./game";
import { Player } from "./player";
import { FieldAction } from "./fieldaction";
import { SpellCardName, SpellCard } from "./spellcard";
import { Item, FairyFriendNames } from "./item";

export type CharaName = "華扇" | "霊夢" | "魔理沙" | "ルーミア" | "チルノ" | "美鈴" | "パチュリー" | "咲夜" | "レミリア" | "フラン" | "レティ" | "橙" | "アリス" | "プリズムリバー" | "妖夢" | "幽々子" | "藍" | "紫" | "萃香" | "リグル" | "ミスティア" | "慧音" | "てゐ" | "優曇華院" | "永琳" | "輝夜" | "妹紅" | "メディスン" | "幽香" | "文" | "小町" | "四季映姫" | "秋姉妹" | "雛" | "にとり" | "早苗" | "神奈子" | "諏訪子" | "衣玖" | "天子" | "ヤマメ" | "パルスィ" | "勇儀" | "さとり" | "燐" | "空" | "こいし" | "ナズーリン" | "小傘" | "一輪" | "村紗" | "星" | "白蓮" | "ぬえ" | "はたて" | "響子" | "芳香" | "青娥" | "布都" | "神子" | "マミゾウ"
export const charaCategories = {
  "バカルテット": ((): CharaName[] => ["チルノ", "ルーミア", "リグル", "ミスティア"])(),
  "紅魔館の住人": ((): CharaName[] => ["美鈴", "パチュリー", "咲夜", "レミリア", "フラン"])(),
  "地霊殿の住人": ((): CharaName[] => ["さとり", "燐", "空", "こいし"])()
};
export type RaceName = "人間" | "幽霊" | "種族不明"
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
  attributeHooks?: AttributeHook[]; // 耐性
  fieldActions?: FieldAction[]; //　特殊能力の使用
  // フックした時に他の選択肢より先に行える能力
  // WARN: 使用しなかった場合は特別なフラグを建てて別の人にはばれないようにする必要がある
  // 例えば霊夢の夢想天生はちょっと無理かも(先に発動してその後二回目の反撃をしてしまう...)
  specificActions?: SpecificActionHook[];
  whenWin?: VictoryHook[];
  whenLose?: VictoryHook[];
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
        b instanceof Player && // 相手がPCで
        a.watched.has(b.id) && // 正体を確認していて
        b.role === "妖怪" &&  // 妖怪で
        c.cardTypes.includes("弾幕")), // 弾幕の時
    ],
    whenWin: [
      ...Victory.allWatchAndAllWinToWin(p => p.role === "妖怪" && p.characterName !== "紫"),
      Victory.waitToWin("博麗神社", ["神社の御札"], 3),
      Victory.gatherToWin("博麗神社", "銘酒", 3)
    ], whenLose: [
      Victory.loseToLose((me, a) => me.watched.has(a.id) && a.level <= 3 && a.role === "妖怪"),
      Victory.damagedToLose(me => me.items.some(x => x.name === "神社の御札"))
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
    whenWin: [
      ...Victory.allWatchAndAllWinToWin(p => p.role === "妖怪" && p.characterName !== "にとり"),
      Victory.waitToWin("魔法の森", ["ミニ八卦炉", "ドロワーズ"], 1),
    ], whenLose: [
    ],
    howToCountItems() { return 0; }, // アイテムは無限に持てる
    canDiscardItem(player, item) { return false; } // アイテムを捨てられない
  }, {
    name: "ルーミア",
    fullname: "ルーミア",
    role: "妖怪",
    spellCard: "ディマーケイション",
    level: 2,
    mental: 7,
    attributeHooks: [
      invalidate2D("バカルテット", ["満身創痍"], (p, d) => d.a + d.b <= p.mental)
    ], whenLose: [
      Victory.destroyedToLose(["月夜の森"]),
    ], whenWin: [
      Victory.waitToWin("月夜の森", ["リボン"], 2),
    ]
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
    ],
    whenWin: [
      Victory.WinToWin((me, a, c) => c.level === 6 && a.friend ? FairyFriendNames.includes(a.friend.name) : false),
      ...Victory.allWatchAndAllWinToWin(p => !charaCategories["バカルテット"].includes(p.characterName)),
    ], whenLose: [
      Victory.destroyedToLose(["霧の湖"]),
    ]
  }, {
    name: "美鈴",
    fullname: "紅美鈴",
    role: "妖怪",
    spellCard: "飛花落葉",
    level: 3,
    mental: 6,
    whenWin: [
      Victory.WinToWin((me, a) => me.currentLand ? me.currentLand.landAttributes.includes("紅マス") : false),

    ]
  }, {
    name: "パチュリー",
    fullname: "パチュリー・ノーレッジ",
    role: "野次馬",
    spellCard: "賢者の石",
    level: 5,
    mental: 5,
  }, {
    name: "咲夜",
    fullname: "十六夜咲夜",
    role: "主人公",
    spellCard: "殺人ドール",
    level: 4,
    mental: 7,
  }, {
    name: "レミリア",
    fullname: "レミリア・スカーレット",
    role: "野次馬",
    spellCard: "紅色の幻想郷",
    level: 5,
    mental: 6,
  }, {
    name: "フラン",
    fullname: "フランドール・スカーレット",
    role: "野次馬",
    spellCard: "そして誰もいなくなるか?",
    level: 5,
    mental: 5,
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
