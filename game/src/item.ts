import { Player } from "./player";
import { Game } from "./game";
import { Choice } from "./choice";
import { FieldItemAction } from "./fieldaction";
import { AttributeHook, invalidate, SpecificActionHook, useAndInvalidate } from "./hook"
import * as FA from "./fieldaction";

export type ItemCategory = "本" | "品物" | "宝物" | "発明品"
export type ItemName =
  "浄玻璃の鏡" | "天狗の腕章" | "ZUN帽" | "神社の御札" | "聖の宝塔" |
  "死神の舟" | "船幽霊の柄杓" | "宝剣" | "蓬莱の薬" | "妖怪の傘" | "銘酒" |
  "羽衣" | "呪法書" | "エア巻物" | "幻想郷の歩き方" | "スポ根漫画" |
  "同人誌" | "文々。新聞" | "鉄人レシピ" | "カリスマの秘訣" |
  "スペカ事典" | "武術指南書" | "求聞史記" | "超整理術" |
  "リボン" | "のびーるアーム" | "PAD" | "もんぺ" |
  "ドロワーズ" | "光学迷彩スーツ" | "ミニ八卦炉" |
  "携帯電話" | "デジカメ" | "猫車" | "河童のリュック" |
  "手作りの人形" | "巨大化茸" | "1up茸" | "毒茸" | "解毒剤" |
  "流し雛" | "藁人形" | "五寸釘" | "タミフル" | "リポD" | "鳳凰の尾" |
  "忘れな草" | "ワンダースワン" | "サッカーボール" | "舟" | "星のかけら"
export type FriendName =
  "大妖精" | "小悪魔" | "リリーホワイト" | "三月精" | "稗田阿求" | "犬走椛"
export const FairyFriendNames: FriendName[] = ["大妖精", "リリーホワイト", "三月精"]
export type ItemCategoryGenericDict<T> = { "本": T[], "品物": T[], "宝物": T[], "発明品": T[], }
export type ItemCategoryDict = ItemCategoryGenericDict<Item>
export type Item = Required<ItemBase<ItemName, ItemCategory>>
type FriendCategory = "仲間"
export type Friend = Required<ItemBase<FriendName, FriendCategory>>
type ItemBase<T, U> = {
  name: T;
  isCursed?: boolean; // 呪いのアイテムは捨てられない
  fieldActions?: FieldItemAction[]; // 手番を消費して行う行動
  attributeHooks?: AttributeHook[] // その属性を帯びた攻撃に対するHook
  // 追加で先に行える特殊能力
  // 使用しない、ということも可能
  specificActions?: SpecificActionHook[];
  id?: number; // 自動で埋まる
  category?: U;// 自動で埋まる
}

export function getItemsData(): ItemCategoryDict {
  let tmp: ItemCategoryGenericDict<ItemBase<ItemName, ItemCategory>> = {
    "宝物": [{
      name: "浄玻璃の鏡",
      fieldActions: [FA.jouhariAction]
    }, {
      name: "天狗の腕章",
      attributeHooks: [invalidate("天狗の腕章", ["天狗警備隊", ["戦闘回避", "特殊能力"], ["戦闘回避", "アイテム"]])]
    }, {
      name: "ZUN帽",
      attributeHooks: [invalidate("ZUN帽", ["呪い"])]
    }, {
      name: "神社の御札",
      attributeHooks: [invalidate("神社の御札", ["呪い"])]
    }, {
      name: "聖の宝塔",
      attributeHooks: [invalidate("聖の宝塔", ["迷い"])]
    },
    { name: "死神の舟" },
    { name: "船幽霊の柄杓" },
    { name: "宝剣" }, {
      name: "蓬莱の薬",
      attributeHooks: [useAndInvalidate("蓬莱の薬", ["満身創痍"])]
    }, {
      name: "妖怪の傘"
    }, {
      name: "銘酒",
      attributeHooks: [invalidate("銘酒", ["NPC戦闘"])]
    }, {
      name: "羽衣",
      attributeHooks: [invalidate("羽衣", [["地形破壊", "残機減少"], ["落とし穴", "残機減少"]])]
    },
    ], "本": [{
      name: "呪法書"
    }, {
      name: "エア巻物"
    }, {
      name: "幻想郷の歩き方"
    }, {
      name: "スポ根漫画"
    }, {
      name: "同人誌"
    }, { name: "文々。新聞" }, {
      name: "鉄人レシピ",
      attributeHooks: [invalidate("鉄人レシピ", ["毒茸", "食あたり", "飲み過ぎ"])]
    }, {
      name: "カリスマの秘訣"
    }, {
      name: "スペカ事典"
    }, {
      name: "武術指南書"
    }, {
      name: "求聞史記"
    }, {
      name: "超整理術"
    }],
    "発明品": [{
      name: "リボン"
    }, {
      name: "のびーるアーム"
    }, {
      name: "PAD", // WARN:「他者の」特殊能力
      attributeHooks: [useAndInvalidate("PAD", [["戦闘", "残機減少"], ["特殊能力", "残機減少"]])]
    }, {
      name: "もんぺ",
      attributeHooks: [useAndInvalidate("もんぺ", [["アクシデント", "残機減少"], ["トラップ", "残機減少"]])]
    }, {
      name: "ドロワーズ",
      attributeHooks: [useAndInvalidate("ドロワーズ", [["地形効果", "残機減少"]])]
    }, {
      name: "光学迷彩スーツ",
      attributeHooks: [invalidate("光学迷彩スーツ", ["NPC戦闘"])]
    },
    { name: "ミニ八卦炉" },
    { name: "携帯電話" },
    { name: "デジカメ" },
    { name: "猫車" },
    { name: "河童のリュック" },
    { name: "手作りの人形" },
    ],
    "品物": [{
      name: "巨大化茸"
    }, {
      name: "1up茸",
      fieldActions: [FA.oneUpMashRoomAction]
    }, {
      name: "毒茸",
      fieldActions: [FA.poisonMashRoomAction]
    }, {
      name: "毒茸",
      fieldActions: [FA.poisonMashRoomAction]
    },
    { name: "解毒剤" },
    { name: "流し雛" },
    { name: "藁人形" },
    { name: "藁人形" },
    { name: "藁人形" },
    { name: "五寸釘", fieldActions: [FA.gosunkugiAction] },
    { name: "五寸釘", fieldActions: [FA.gosunkugiAction] },
    { name: "五寸釘", fieldActions: [FA.gosunkugiAction] },
    { name: "タミフル" },
    { name: "タミフル" },
    { name: "タミフル" },
    { name: "リポD" },
    { name: "リポD" },
    {
      name: "鳳凰の尾",
      attributeHooks: [useAndInvalidate("鳳凰の尾", ["満身創痍"])]
    },
    { name: "忘れな草" },
    { name: "ワンダースワン" },
    { name: "サッカーボール" },
    { name: "舟" },
    // WARN:星のかけらは特殊なのでアイテム獲得に書いてる(???)
    { name: "星のかけら" },
    { name: "星のかけら" },
    { name: "星のかけら" },
    { name: "星のかけら" },
    { name: "星のかけら" },
    { name: "星のかけら" },
    { name: "星のかけら" },
    { name: "星のかけら" },
    ]
  };
  let result: ItemCategoryDict = { "発明品": [], "本": [], "宝物": [], "品物": [] };
  let categories: ItemCategory[] = ["発明品", "本", "宝物", "品物"];
  let i = 0;
  for (let category of categories) {
    for (let item of tmp[category]) {
      result[category].push({
        id: i++,
        name: item.name,
        category: category,
        isCursed: item.isCursed || false,
        fieldActions: item.fieldActions || [],
        attributeHooks: item.attributeHooks || [],
        specificActions: item.specificActions || [],
      })
    }
  }
  return result;
}
export function getFriendsData(): Friend[] {
  let tmp: ItemBase<FriendName, FriendCategory>[] = [
    { name: "大妖精" },
    { name: "小悪魔" },
    { name: "リリーホワイト" },
    {
      name: "三月精",
      attributeHooks: [invalidate("三月精", [["妖精", "幻覚", "地形効果"], ["妖精", "幻覚", "アクシデント"], ["妖精", "幻覚", "トラップ"]])]
    }, {
      name: "稗田阿求"
    }, {
      name: "犬走椛",
      attributeHooks: [invalidate("犬走椛", ["天狗警備隊"])]
    },
  ]
  let friednCategory: FriendCategory = "仲間";
  let result: Friend[] = tmp.map((item, i) => {
    return {
      id: i++,
      name: item.name,
      category: friednCategory,
      isCursed: item.isCursed || false,
      fieldActions: item.fieldActions || [],
      attributeHooks: item.attributeHooks || [],
      specificActions: item.specificActions || [],
    }
  })
  return result;
}
