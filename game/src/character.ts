import { Hook, message, Choice, Attribute } from "./choice";
import { Game } from "./game";
import { Player } from "./player";

export type CharaName = "霊夢" | "魔理沙" | "ルーミア" | "アリス" | "チルノ" | "パチュリー" | "幽々子"
export type RaceName = "人間" | "種族不明"
type GameAction = (this: Game, player: Player) => Choice<any>[];
type CharacterBase = {
  name: CharaName;
  fullname: string;
  level: number; // レベル
  mental: number; // 精神力
  race?: RaceName;
  hooks?: Hook[];
  bombAction?: GameAction[];
}
export type Character = {
  id: number;
  name: CharaName;
  fullname: string;
  level: number; // レベル
  mental: number; // 精神力
  race: RaceName;
  hooks: Hook[];
  bombAction: GameAction[];
}
function invalidate(attrs: (Attribute | Attribute[])[], when?: (p: Player) => boolean): Hook {
  return {
    when: attrs,
    choices(player: Player) {
      if (when && !when(player)) return [];
      return [message(attrs.join("/") + "をキャラ効果で無効にする！")];
    }
  }
}


export function getAllCharacters(): Character[] {
  let tmp: CharacterBase[] = [{
    name: "霊夢",
    fullname: "博麗 霊夢",
    level: 4,
    mental: 7,
    race: "人間",
    hooks: [
      invalidate(["能力低下"], p => p.items.some(x => x.name !== "銘酒")),
      {
        when: ["残機減少", ["地形破壊", "落とし穴", "大ナマズ"]],
        choices(player: Player) {
          return this.getDiceChoices(player, "空を飛んで残機減少無効化", d => {
            if (d.dice <= player.level) return [message("残機減少無効化成功！ ")];
            return [new Choice("残機減少無効化失敗", {}, () => { this.damaged(player); })]
          });
        }
      }]
  }, {
    name: "魔理沙",
    fullname: "霧雨魔理沙",
    level: 4,
    mental: 7,
    hooks: [invalidate(["毒茸"])]
  }, {
    name: "ルーミア",
    fullname: "ルーミア",
    level: 2,
    mental: 7
  }, {
    name: "チルノ",
    fullname: "チルノ",
    level: 1,
    mental: 9,
    hooks: [
      invalidate([["残機減少", "地形破壊"]]),
      invalidate(["妖精"]),
      {
        when: ["呪い", "能力低下"],
        choices(p: Player, a?: Attribute[]): Choice<any>[] {
          if (!a || a.includes("地形効果")) return [];
          return [message("キャラクターの効果で無効にした！ ")];
        }
      }
    ]
  }, {
    name: "幽々子",
    fullname: "西行寺幽々子",
    level: 5,
    mental: 6,
    hooks: [
      invalidate(["呪い", "能力低下"]),
      {
        force: true,
        when: ["毒茸", "食あたり", "飲み過ぎ"],
        choices(this: Game, player: Player) {
          return this.getTwoDiceChoices(player, "大食い亡霊", dice => {
            let success = dice.x + dice.y <= player.level
            if (!success) return [message("大食いをした！ ")]
            player.heal();
            return [message("大食いをして残機が1増えた！ ")]
          })
        }
      }
    ]
  }]
  let result: Character[] = [];
  tmp.forEach((x, i) => result.push({
    id: i,
    name: x.name,
    fullname: x.fullname,
    level: x.level,
    mental: x.mental,
    race: x.race || "種族不明",
    hooks: x.hooks || [],
    bombAction: x.bombAction || [],
  }));
  return result;
}
