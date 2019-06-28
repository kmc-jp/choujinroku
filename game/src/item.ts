import { Player } from "./player";
import { Game } from "./game";
import { Choice, FieldAction, ResistanceHook, invalidate } from "./choice";

export type ItemCategory = "本" | "品物" | "宝物" | "発明品"
export type ItemName = "浄玻璃の鏡" | "銘酒" | "聖の宝塔" | "巨大化茸" | "リボン" | "呪法書"
export type ItemCategoryGenericDict<T> = { "本": T[], "品物": T[], "宝物": T[], "発明品": T[], }
export type ItemCategoryDict = ItemCategoryGenericDict<Item>
export type Item = Required<ItemBase>
type ItemBase = {
  name: ItemName;
  isCurse?: boolean; // 呪いのアイテムは捨てられない
  fieldActions?: FieldAction[];
  resistanceHooks?: ResistanceHook[]
  id?: number; // 自動で埋まる
  category?: ItemCategory;// 自動で埋まる
}

export function getItemsData(): ItemCategoryDict {
  let tmp: ItemCategoryGenericDict<ItemBase> = {
    "宝物": [
      {
        name: "浄玻璃の鏡",
        fieldActions: [
          function (this: Game, player: Player): Choice<any>[] {
            // 1D <= レベルで縦横で隣接したマスの他者1人の正体がわかる
            let name = "浄玻璃の鏡"
            return this.getPlayersNextTo(player.pos)
              .filter(x => !player.watched.has(x.id))
              .map(other => new Choice(`${other.name}に${name}を使用`, {}, () => {
                player.choices = this.getDiceChoices(player, name,
                  dice => {
                    if (dice.dice <= player.level) this.watch(player, other);
                    this.doFieldAction(player);
                  })
              }));
          }
        ]
      },
      {
        name: "聖の宝塔",
        resistanceHooks: [invalidate(["迷い"])]
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
        isCurse: item.isCurse || false,
        fieldActions: item.fieldActions || [],
        resistanceHooks: item.resistanceHooks || []
      })
    }
  }
  return result;
}

export type Friend = {
  id: number;
  name: string;
}
