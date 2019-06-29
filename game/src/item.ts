import { Player } from "./player";
import { Game } from "./game";
import { Choice } from "./choice";
import { FieldAction } from "./fieldaction";
import { AttributeHook, invalidate, SpecificActionHook } from "./hook"
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
export type ItemCategoryGenericDict<T> = { "本": T[], "品物": T[], "宝物": T[], "発明品": T[], }
export type ItemCategoryDict = ItemCategoryGenericDict<Item>
export type Item = Required<ItemBase<ItemName, ItemCategory>>
type FriendCategory = "仲間"
export type Friend = Required<ItemBase<FriendName, FriendCategory>>
type ItemBase<T, U> = {
  name: T;
  isCursed?: boolean; // 呪いのアイテムは捨てられない
  fieldActions?: FieldAction[]; // 手番を消費して行う行動
  attributeHooks?: AttributeHook[] // その属性を帯びた攻撃に対するHook
  specificAdditionalActions?: SpecificActionHook[]; // 追加で*先に*行える特殊能力
  specificActions?: SpecificActionHook[]; // フックした時に他の選択肢を上書きして行われる能力
  id?: number; // 自動で埋まる
  category?: U;// 自動で埋まる
}

export function getItemsData(): ItemCategoryDict {
  let tmp: ItemCategoryGenericDict<ItemBase<ItemName, ItemCategory>> = {
    "宝物": [
      {
        name: "浄玻璃の鏡",
        fieldActions: [FA.jouhariFieldAction]
      },
      { name: "天狗の腕章" },
      { name: "ZUN帽" },
      { name: "神社の御札" },
      {
        name: "聖の宝塔",
        attributeHooks: [invalidate("聖の宝塔", ["迷い"])]
      },
      { name: "死神の舟" },
      { name: "船幽霊の柄杓" },
      { name: "宝剣" },
      { name: "蓬莱の薬" },
      { name: "妖怪の傘" },
      { name: "銘酒" },
      { name: "羽衣" },
    ], "本": [
      { name: "呪法書" },
      { name: "エア巻物" },
      { name: "幻想郷の歩き方" },
      { name: "スポ根漫画" },
      { name: "同人誌" },
      { name: "文々。新聞" },
      { name: "鉄人レシピ" },
      { name: "カリスマの秘訣" },
      { name: "スペカ事典" },
      { name: "武術指南書" },
      { name: "求聞史記" },
      { name: "超整理術" },
    ], "発明品": [
      { name: "リボン" },
      { name: "のびーるアーム" },
      { name: "PAD" },
      { name: "もんぺ" },
      { name: "ドロワーズ" },
      { name: "光学迷彩スーツ" },
      { name: "ミニ八卦炉" },
      { name: "携帯電話" },
      { name: "デジカメ" },
      { name: "猫車" },
      { name: "河童のリュック" },
      { name: "手作りの人形" },
    ], "品物": [
      { name: "巨大化茸" },
      { name: "1up茸" },
      { name: "毒茸" },
      { name: "毒茸" },
      { name: "解毒剤" },
      { name: "流し雛" },
      { name: "藁人形" },
      { name: "藁人形" },
      { name: "藁人形" },
      { name: "五寸釘" },
      { name: "五寸釘" },
      { name: "五寸釘" },
      { name: "タミフル" },
      { name: "タミフル" },
      { name: "タミフル" },
      { name: "リポD" },
      { name: "リポD" },
      { name: "鳳凰の尾" },
      { name: "忘れな草" },
      { name: "ワンダースワン" },
      { name: "サッカーボール" },
      { name: "舟" },
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
        specificAdditionalActions: item.specificAdditionalActions || [],
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
    { name: "三月精" },
    { name: "稗田阿求" },
    { name: "犬走椛" },
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
      specificAdditionalActions: item.specificAdditionalActions || [],
    }
  })
  return result;
}
