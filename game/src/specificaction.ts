import { Player } from "./player";
import { Game } from "./game";
import { SpellCard } from "./spellcard";
import { Choice } from "./choice";
import { SpecificActionHook, NPCType } from "./hooktype";

// 条件を満たしたら手札1枚ドロー
export function drawACard(skillName: string, success: (a: Player, b: Player | NPCType, c: SpellCard, isRevenge: boolean) => boolean): SpecificActionHook {
  return {
    type: "Attack",
    when: ["Attack"],
    skillName: skillName,
    hook(this: Game, a: Player, b: Player | NPCType, spellCard: SpellCard, isRevenge: boolean, me?: Player) {
      if (spellCard === undefined) return [];
      if (!success(a, b, spellCard, isRevenge)) return [];
      return [new Choice(skillName + ":手札1枚ドロー", () => {
        this.drawACard(a);
      })];
    }
  }
}
