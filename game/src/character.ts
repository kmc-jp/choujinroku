import { Hook, message, Choice } from "./choice";
import { Game } from "./game";
import { Player } from "./player";

export type CharaName = "霊夢" | "魔理沙" | "ルーミア"
type CharacterBase = {
  name: CharaName;
  fullname: string;
  level: number; // レベル
  mental: number; // 精神力
  hooks?: Hook[];
}
export type Character = {
  id: number;
  name: CharaName;
  fullname: string;
  level: number; // レベル
  mental: number; // 精神力
  hooks: Hook[];
}
export function getAllCharacters(): Character[] {
  let tmp: CharacterBase[] = [{
    name: "霊夢",
    fullname: "博麗 霊夢",
    level: 4,
    mental: 7,
    hooks: [{
      when: ["能力低下"],
      choices(player: Player) {
        if (player.items.some(x => x.name !== "銘酒")) return [];
        return [message("銘酒を持っている霊夢は能力低下が無効にできるぞ！")];
      }
    }, {
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
    hooks: [
      {
        when: ["毒茸"],
        choices() { return [message("魔理沙は毒茸を無効化できるぞ！ ")]; }
      }
    ]
  }, {
    name: "ルーミア",
    fullname: "ルーミア",
    level: 2,
    mental: 7
  }]
  let result: Character[] = [];
  tmp.forEach((x, i) => result.push({
    id: i,
    name: x.name,
    fullname: x.fullname,
    level: x.level,
    mental: x.mental,
    hooks: x.hooks || []
  }));
  return result;
}
