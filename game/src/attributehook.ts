import { ItemName } from "./item";
import { RoleName, CharaName } from "./character";
import { Attribute, AttributeHook, TwoDice } from "./hooktype";
import { Player } from "./player";
import { choices } from "./choice";


// AttributeHook の略記法で条件に合った時に効果を無効化する選択肢を提示する
export function invalidate(skillName: string, attrs: (Attribute | Attribute[])[], when?: (p: Player, a: Attribute[]) => boolean): AttributeHook {
  return {
    skillName: skillName,
    when: attrs,
    choices(player: Player, attributes?: Attribute[]) {
      if (when && !when(player, attributes ? attributes : [])) return [];
      return choices(skillName + "で無効化！");
    }
  }
}

//アイテムを消費して無効化
export function useAndInvalidate(itemName: ItemName, attrs: (Attribute | Attribute[])[], when?: (p: Player, a: Attribute[]) => boolean): AttributeHook {
  return {
    skillName: itemName,
    when: attrs,
    choices(player: Player, attributes?: Attribute[]) {
      if (when && !when(player, attributes ? attributes : [])) return [];
      return choices(itemName + "を消費して無効化！", () => {
        let items = player.items.filter(x => x.name === itemName);
        if (items.length <= 0) return;
        let item = items[0]
        this.sendBackItem(player, item);
      });
    }
  }
}

export function invalidate1D(skillName: string, attrs: (Attribute | Attribute[])[], success: (p: Player, dice: number) => boolean): AttributeHook {
  return {
    skillName: skillName,
    when: attrs,
    needDice: { type: "1D", success(p: Player, dice: number) { return success(p, dice); } },
    choices(player: Player, attributes?: Attribute[]) {
      return choices(skillName + "で無効化成功！");
    }
  }
}

export function invalidate2D(skillName: string, attrs: (Attribute | Attribute[])[], success: (p: Player, dice: TwoDice) => boolean): AttributeHook {
  return {
    skillName: skillName,
    when: attrs,
    needDice: { type: "2D", success(p: Player, dice: TwoDice) { return success(p, dice); } },
    choices(player: Player, attributes?: Attribute[]) {
      return choices(skillName + "で無効化成功！");
    }
  }
}