export type ItemCategory = "本" | "品物" | "宝物" | "発明品"
export type ItemData = {
  id: number;
  name: string;
  category: ItemCategory;
}
export type ItemCategoryDict<T> = { "本": T[], "品物": T[], "宝物": T[], "発明品": T[], }
export function getItemsData(): ItemCategoryDict<ItemData> {
  return {
    "宝物": [
      { id: 0, name: "浄玻璃の鏡", category: "宝物" },
      { id: 1, name: "浄玻璃の鏡", category: "宝物" },
      { id: 2, name: "浄玻璃の鏡", category: "宝物" },
      { id: 3, name: "浄玻璃の鏡", category: "宝物" },
      { id: 4, name: "浄玻璃の鏡", category: "宝物" },
      { id: 5, name: "浄玻璃の鏡", category: "宝物" },
      { id: 6, name: "浄玻璃の鏡", category: "宝物" },
      { id: 7, name: "浄玻璃の鏡", category: "宝物" },
      { id: 8, name: "浄玻璃の鏡", category: "宝物" },
      { id: 9, name: "浄玻璃の鏡", category: "宝物" },
    ], "本": [
      { id: 10, name: "呪法書", category: "本" },
      { id: 11, name: "呪法書", category: "本" },
      { id: 12, name: "呪法書", category: "本" },
      { id: 13, name: "呪法書", category: "本" },
      { id: 14, name: "呪法書", category: "本" },
      { id: 15, name: "呪法書", category: "本" },
      { id: 16, name: "呪法書", category: "本" },
      { id: 17, name: "呪法書", category: "本" },
      { id: 18, name: "呪法書", category: "本" },
      { id: 19, name: "呪法書", category: "本" },
    ], "発明品": [
      { id: 20, name: "リボン", category: "発明品" },
      { id: 21, name: "リボン", category: "発明品" },
      { id: 22, name: "リボン", category: "発明品" },
      { id: 23, name: "リボン", category: "発明品" },
      { id: 24, name: "リボン", category: "発明品" },
      { id: 25, name: "リボン", category: "発明品" },
      { id: 26, name: "リボン", category: "発明品" },
      { id: 27, name: "リボン", category: "発明品" },
      { id: 28, name: "リボン", category: "発明品" },
      { id: 29, name: "リボン", category: "発明品" },
    ], "品物": [
      { id: 30, name: "巨大化菌", category: "品物" },
      { id: 31, name: "巨大化菌", category: "品物" },
      { id: 32, name: "巨大化菌", category: "品物" },
      { id: 33, name: "巨大化菌", category: "品物" },
      { id: 34, name: "巨大化菌", category: "品物" },
      { id: 35, name: "巨大化菌", category: "品物" },
      { id: 36, name: "巨大化菌", category: "品物" },
      { id: 37, name: "巨大化菌", category: "品物" },
      { id: 38, name: "巨大化菌", category: "品物" },
      { id: 39, name: "巨大化菌", category: "品物" },
      { id: 40, name: "巨大化菌", category: "品物" },
      { id: 41, name: "巨大化菌", category: "品物" },
      { id: 42, name: "巨大化菌", category: "品物" },
      { id: 43, name: "巨大化菌", category: "品物" },
      { id: 44, name: "巨大化菌", category: "品物" },
      { id: 45, name: "巨大化菌", category: "品物" },
      { id: 46, name: "巨大化菌", category: "品物" },
      { id: 47, name: "巨大化菌", category: "品物" },
      { id: 48, name: "巨大化菌", category: "品物" },
      { id: 49, name: "巨大化菌", category: "品物" },
      { id: 50, name: "巨大化菌", category: "品物" },
      { id: 51, name: "巨大化菌", category: "品物" },
      { id: 52, name: "巨大化菌", category: "品物" },
      { id: 53, name: "巨大化菌", category: "品物" },
      { id: 54, name: "巨大化菌", category: "品物" },
      { id: 55, name: "巨大化菌", category: "品物" },
      { id: 56, name: "巨大化菌", category: "品物" },
      { id: 57, name: "巨大化菌", category: "品物" },
      { id: 58, name: "巨大化菌", category: "品物" },
      { id: 59, name: "巨大化菌", category: "品物" },
    ]
  }
}
const items = getItemsData();
export class Item implements ItemData {
  id: number;
  name: string;
  category: ItemCategory;

  constructor(data: ItemData) {
    this.id = data.id;
    this.name = data.name;
    this.category = data.category;
  }
}

export type Friend = {
  id: number;
  name: string;
}
