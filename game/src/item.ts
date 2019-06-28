import { Player } from "./player";
import { Game } from "./game";
import { Choice } from "./choice";
import { FieldAction } from "./fieldaction";
import { AttributeHook, invalidate, SpecificActionHook } from "./hook"
import * as FA from "./fieldaction";

export type ItemCategory = "本" | "品物" | "宝物" | "発明品"
export type ItemName = "浄玻璃の鏡" | "銘酒" | "聖の宝塔" | "巨大化茸" | "リボン" | "呪法書" | "神社の御札" | "銘酒"
export type FriendName = "大妖精"
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
      {
        name: "聖の宝塔",
        attributeHooks: [invalidate("聖の宝塔", ["迷い"])]
      },
      { name: "浄玻璃の鏡" },
      { name: "浄玻璃の鏡" },
      { name: "浄玻璃の鏡" },
      { name: "浄玻璃の鏡" },
      { name: "浄玻璃の鏡" },
      { name: "浄玻璃の鏡" },
      { name: "浄玻璃の鏡" },
      { name: "浄玻璃の鏡" },
    ], "本": [
      { name: "呪法書" },
      { name: "呪法書" },
      { name: "呪法書" },
      { name: "呪法書" },
      { name: "呪法書" },
      { name: "呪法書" },
      { name: "呪法書" },
      { name: "呪法書" },
      { name: "呪法書" },
      { name: "呪法書" },
    ], "発明品": [
      { name: "リボン" },
      { name: "リボン" },
      { name: "リボン" },
      { name: "リボン" },
      { name: "リボン" },
      { name: "リボン" },
      { name: "リボン" },
      { name: "リボン" },
      { name: "リボン" },
      { name: "リボン" },
    ], "品物": [
      { name: "巨大化茸" },
      { name: "巨大化茸" },
      { name: "巨大化茸" },
      { name: "巨大化茸" },
      { name: "巨大化茸" },
      { name: "巨大化茸" },
      { name: "巨大化茸" },
      { name: "巨大化茸" },
      { name: "巨大化茸" },
      { name: "巨大化茸" },
      { name: "巨大化茸" },
      { name: "巨大化茸" },
      { name: "巨大化茸" },
      { name: "巨大化茸" },
      { name: "巨大化茸" },
      { name: "巨大化茸" },
      { name: "巨大化茸" },
      { name: "巨大化茸" },
      { name: "巨大化茸" },
      { name: "巨大化茸" },
      { name: "巨大化茸" },
      { name: "巨大化茸" },
      { name: "巨大化茸" },
      { name: "巨大化茸" },
      { name: "巨大化茸" },
      { name: "巨大化茸" },
      { name: "巨大化茸" },
      { name: "巨大化茸" },
      { name: "巨大化茸" },
      { name: "巨大化茸" },
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
    { name: "大妖精" }
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
