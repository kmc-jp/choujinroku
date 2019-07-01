import { Player } from "./player";
import { Game } from "./game";
import { SpellCard } from "./spellcard";
import { Choice } from "./choice";
import { SpecificActionHook } from "./hook";

// 条件を満たしたら手札1枚ドロー
export function drawACard(skillName: string, success: (a: Player, b: Player, c: SpellCard) => boolean): SpecificActionHook {
  return {
    type: "Battle",
    when: ["Attack"],
    skillName: skillName,
    hook(this: Game, a: Player, b: Player, c: SpellCard): Choice[] {
      if (!success(a, b, c)) return [];
      return [new Choice(skillName + ":手札1枚ドロー", () => {
        this.drawACard(a);
      })];
    }
  }
}
