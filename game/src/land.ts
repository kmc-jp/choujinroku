import { CharaName } from "./character";
import { Game } from "./game";
import { Player, Attribute, WithAttribute } from "./player";
import { Choice } from "./choice";
import * as _ from "underscore";

export type LandName = "博麗神社" | "魔法の森" | "月夜の森" | "霧の湖"
export type Land = {
  id: number;
  name: LandName;
  nextTo: LandName[];
  whenEnter: (this: Land, game: Game, player: Player, attrs: WithAttribute) => Choice<any>[];
  whenExit: (this: Land, game: Game, player: Player, attrs: WithAttribute) => Choice<any>[];
}
function nopWithText(text: string): Choice<{}>[] {
  return [new Choice(text, {}, () => { })];
}
function nop(): Choice<any>[] { return [] }
function getFromStudio(game: Game, player: Player): Choice<any>[] {
  // 工房判定
  return nopWithText("工房判定は何も手に入らなかった...")
}
function getGoods(game: Game, player: Player): Choice<any>[] {
  if (!player.isAbleToGetSomething) return nopWithText("品物は得られ無かった...");
  return nopWithText("品物は得られなかった...");
}
function hakurei1D(this: Land, game: Game, player: Player, attrs: WithAttribute): Choice<any>[] {
  // 被弾だがおおよそ無効化できるので属性は付与しなければならない...
  return game.getDiceChoices(player, `${this.name}:入ったら1D`, d => {
    let dice = d.dice;
    if (dice === 1) attrs.choices = getFromStudio(game, player);
    else if (dice <= 3) attrs.choices = getGoods(game, player);
    else if (dice <= 5) attrs.choices = nopWithText("外の世界の品物を発見したが使い途が判らず捨てた");
    else {
      let text = "宴会で飲みすぎて前後不覚になり戦闘履歴が無作為に一人分初期化される";
      attrs = attrs.with("飲み過ぎ");
      attrs.choices = new Choice(text, {}, () => {
        let w = player.wonArray;
        if (w.length <= 0) {
          attrs.choices = nopWithText("初期化される戦闘履歴が無かった...");
          return;
        }
        let target = game.players[_.shuffle<number>(w)[0]];
        attrs.choices = new Choice(
          `飲みすぎて${target.name}の戦闘履歴が初期化された`,
          {}, () => game.forgetWin(player, target));
      });
    }
  });
}

export function getLands(): Land[] {
  let tmp: Partial<Land>[] = [
    { name: "博麗神社", nextTo: [], whenEnter: hakurei1D, },
    { name: "魔法の森", nextTo: [], },
    { name: "月夜の森", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
    { name: "霧の湖", nextTo: [], },
  ];
  return tmp.map((x, i) => {
    return {
      id: i,
      name: x.name || "霧の湖",
      nextTo: x.nextTo || [],
      whenEnter: x.whenEnter || nop,
      whenExit: x.whenExit || nop
    }
  });
}
