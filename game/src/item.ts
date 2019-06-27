import { Player } from "./player";
import { Game } from "./game";
import { Choice } from "./choice";

export type ItemCategory = "本" | "品物" | "宝物" | "発明品"
type FieldAction = (this: Item, game: Game, player: Player) => Choice<any>[]
export type Item = {
  id: number;
  name: string;
  fullText: string;
  category: ItemCategory;
  isCurse: boolean; // 呪いのアイテムは捨てられない
  fieldAction: FieldAction | null;
}
export type ItemCategoryGenericDict<T> = { "本": T[], "品物": T[], "宝物": T[], "発明品": T[], }
export type ItemCategoryDict = ItemCategoryGenericDict<Item>
function jouhari(this: Item, game: Game, player: Player): Choice<any>[] {
  // 1D <= レベルで縦横で隣接したマスの他者1人の正体がわかる
  return game.getPlayersNextTo(player.pos)
    .filter(x => !player.watched.has(x.id))
    .map(other => new Choice(`${other.name}に${this.name}を使用`, {}, () => {
      player.choices = game.getDiceChoices(player, this.name,
        dice => {
          game.byPhase(
            () => { if (dice.dice <= player.character.level) game.watch(player, other); },
            () => game.askPlayerTurn(player)
          );
        })
    }));
}



export function getItemsData(): ItemCategoryDict {
  let tmp: ItemCategoryGenericDict<Partial<Item>> = {
    "宝物": [
      { name: "浄玻璃の鏡", fieldAction: jouhari },
      { name: "浄玻璃の鏡" },
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
      { name: "巨大化菌" },
      { name: "巨大化菌" },
      { name: "巨大化菌" },
      { name: "巨大化菌" },
      { name: "巨大化菌" },
      { name: "巨大化菌" },
      { name: "巨大化菌" },
      { name: "巨大化菌" },
      { name: "巨大化菌" },
      { name: "巨大化菌" },
      { name: "巨大化菌" },
      { name: "巨大化菌" },
      { name: "巨大化菌" },
      { name: "巨大化菌" },
      { name: "巨大化菌" },
      { name: "巨大化菌" },
      { name: "巨大化菌" },
      { name: "巨大化菌" },
      { name: "巨大化菌" },
      { name: "巨大化菌" },
      { name: "巨大化菌" },
      { name: "巨大化菌" },
      { name: "巨大化菌" },
      { name: "巨大化菌" },
      { name: "巨大化菌" },
      { name: "巨大化菌" },
      { name: "巨大化菌" },
      { name: "巨大化菌" },
      { name: "巨大化菌" },
      { name: "巨大化菌" },
    ]
  };
  let result: ItemCategoryDict = { "発明品": [], "本": [], "宝物": [], "品物": [] };
  let categories: ItemCategory[] = ["発明品", "本", "宝物", "品物"];
  let i = 0;
  for (let category of categories) {
    for (let item of tmp[category]) {
      result[category].push({
        id: i++,
        name: item.name || "巨大化菌",
        fullText: item.fullText || "詳細不明",
        category: category,
        isCurse: item.isCurse || false,
        fieldAction: item.fieldAction || null
      })
    }
  }
  return result;
}

export type Friend = {
  id: number;
  name: string;
}
