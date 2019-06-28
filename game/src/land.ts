import { Game } from "./game";
import { Player } from "./player";
import { Choice, message, nop } from "./choice";
import { AttributeHook, Attribute, invalidate, WithAttribute, TwoDice } from "./hook";
import * as _ from "underscore";
import { CharaName } from "./character";

export type LandName = "博麗神社" | "魔法の森" | "月夜の森" | "霧の湖" | "温泉" | "???"
export type LandAttribute = "花マス" | "森マス" | "水マス"
export type Land = Required<LandBase>
export type PowerUp = {
  addOneCard?: CharaName[];
  levelUp?: CharaName[];
  mentalUp?: CharaName[];
}
type LandBase = {
  id?: number;
  name: LandName;
  nextTo: LandName[];
  attributeHooks?: AttributeHook[];
  landAttributes?: LandAttribute[];
  ignores?: CharaName[]; // 「上記効果無効」のキャラリスト
  powerUp?: PowerUp;
  whenEnter?: (this: Land, game: Game, player: Player, attrs: WithAttribute) => Choice<any>[];
  whenExit?: (this: Land, game: Game, player: Player, attrs: WithAttribute) => Choice<any>[];
}
function 工房判定(game: Game, player: Player): Choice<any>[] {
  // 工房判定
  return [message("工房判定は未実装だった...")]
}
function happenEvent(game: Game, player: Player): Choice<any>[] {
  return [message("イベント表は未実装だった！ ")];
}
function happenAccident(game: Game, player: Player): Choice<any>[] {
  return [message("アクシデント表は未実装だった！ ")];
}
function happenTrap(game: Game, player: Player): Choice<any>[] {
  return [message("トラップ表は未実装だった！ ")];
}
function getGoods(game: Game, player: Player): Choice<any>[] {
  if (!player.isAbleToGetSomething) return [message("品物は得られ無かった...")];
  return [message("品物を得るのは未実装だった...")];
}
function wrap1D(callback: (this: Game, dice: number, player: Player, attrs: WithAttribute) => any) {
  return function (this: Land, game: Game, player: Player, attrs: WithAttribute): Choice<any>[] {
    return attrs.wrap(game.getDiceChoices(player, `${this.name}:1D`, d => {
      callback.bind(game)(d.dice, player, attrs);
    }));
  }
}
function wrap2D(callback: (this: Game, dice: TwoDice, player: Player, attrs: WithAttribute) => any) {
  return function (this: Land, game: Game, player: Player, attrs: WithAttribute): Choice<any>[] {
    return attrs.wrap(game.getTwoDiceChoices(player, `${this.name}:1D`, d => {
      callback.bind(game)(d, player, attrs);
    }));
  }
}
// 属性の付与を忘れずに！
function 博麗神社1D(this: Game, dice: number, player: Player, attrs: WithAttribute) {
  if (dice === 1) attrs.choices = 工房判定(this, player);
  else if (dice <= 3) attrs.choices = getGoods(this, player);
  else if (dice <= 5) attrs.choices = [message("外の世界の品物を発見したが使い途が判らず捨てた")];
  else {
    let text = "宴会で飲みすぎて前後不覚になり戦闘履歴が無作為に一人分初期化される";
    attrs = attrs.with("飲み過ぎ");
    attrs.choices = new Choice(text, {}, () => {
      let w = player.wonArray;
      if (w.length <= 0) {
        attrs.choices = [message("初期化される戦闘履歴が無かった...")];
        return;
      }
      let target = this.players[_.shuffle<number>(w)[0]];
      attrs.choices = new Choice(
        `飲みすぎて${target.name}の戦闘履歴が初期化された`,
        {}, () => player.won.delete(target.id));
    });
  }
}
function 魔法の森2D(this: Game, dice: TwoDice, player: Player, attrs: WithAttribute) {
  if (dice.a !== dice.b) return;
  attrs.with("毒茸", "残機減少").choices = new Choice("うっかり毒茸を食べてしまい残機減少", {}, () => {
    this.damaged(player);
  });
}
function 月夜の森1D(this: Game, dice: number, player: Player, attrs: WithAttribute) {
  if (dice <= player.level) return;
  attrs.choices = new Choice("妖怪に攻撃されたけど未実装だった！", {}, () => { })
}
// 属性の付与を忘れずに！
function 霧の湖1D(this: Game, dice: number, player: Player, attrs: WithAttribute) {
  if (player.characterName === "チルノ") dice = 1;
  if (dice >= 5 && player.characterName === "パチュリー") attrs.choices = [message("5,6の出目は無視します")];
  else if (dice === 1) attrs.choices = new Choice("大妖精が仲間に成りかけたが未実装だった！", {}, () => { });
  else if (dice === 2) attrs.choices = getGoods(this, player);
  else if (dice === 3) attrs.choices = happenEvent(this, player);
  else if (dice === 4) attrs.choices = happenAccident(this, player);
  else if (dice === 5) attrs.with("幻覚", "手番休み", "妖精").choices = [message("妖精に悪戯されたけど未実装だった！ ")];
  else if (dice === 6) attrs.choices = [message("妖精に攻撃されたけど未実装だった！ ")];
}


export function getLands(): Land[] {
  let tmp: LandBase[] = [
    {
      name: "博麗神社",
      nextTo: ["温泉"],
      landAttributes: ["花マス"],
      whenEnter: wrap1D(博麗神社1D),
      powerUp: { addOneCard: ["霊夢"] },
      attributeHooks: [invalidate("", ["能力低下"], p => p.race === "人間")]
    },
    {
      name: "魔法の森",
      landAttributes: ["森マス"],
      ignores: ["魔理沙", "アリス"],
      powerUp: { addOneCard: ["魔理沙", "アリス"] },
      nextTo: [],
      whenEnter: wrap2D(魔法の森2D),
      attributeHooks: [invalidate("", ["幻覚"], p => p.characterName === "魔理沙")]
    },
    {
      name: "月夜の森",
      landAttributes: ["森マス"],
      ignores: ["ルーミア"],
      nextTo: [],
      whenEnter: wrap1D(月夜の森1D)
    },
    {
      name: "霧の湖",
      landAttributes: ["水マス"],
      powerUp: { addOneCard: ["チルノ"] },
      nextTo: [],
      whenEnter: wrap1D(霧の湖1D)
    },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
    { name: "???", nextTo: [], },
  ];
  console.assert(tmp.length === 36);
  return tmp.map((x, i) => {
    x.ignores = x.ignores || []
    if (x.ignores.length > 0) {
      if (x.whenEnter) {
        let original = x.whenEnter;
        x.whenEnter = function (this: Land, game: Game, player: Player, attrs: WithAttribute): Choice<any>[] {
          if ((x.ignores || []).some(y => y === player.characterName)) return [];
          return original.bind(this)(game, player, attrs);
        }
      }
      if (x.whenExit) {
        let original = x.whenExit;
        x.whenExit = function (this: Land, game: Game, player: Player, attrs: WithAttribute): Choice<any>[] {
          if ((x.ignores || []).some(y => y === player.characterName)) return [];
          return original.bind(this)(game, player, attrs);
        }
      }
    }
    return {
      id: i,
      ignores: x.ignores || [],
      landAttributes: x.landAttributes || [],
      name: x.name || "霧の湖",
      nextTo: x.nextTo || [],
      whenEnter: x.whenEnter || nop,
      whenExit: x.whenExit || nop,
      attributeHooks: x.attributeHooks || [],
      powerUp: x.powerUp || {},
    }
  });
}
