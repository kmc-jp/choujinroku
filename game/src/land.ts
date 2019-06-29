import { Game } from "./game";
import { Player } from "./player";
import { Choice, message, nop } from "./choice";
import { AttributeHook, Attribute, invalidate, WithAttribute, TwoDice } from "./hook";
import * as _ from "underscore";
import { CharaName } from "./character";

export type LandName =
  "博麗神社" | "魔法の森" | "月夜の森" | "霧の湖" | "紅魔館入口" | "図書館" |
  "紅魔館" | "無何有の郷" | "マヨヒガの森" | "白玉楼" |
  "川の畔の草原" | "夜雀の屋台" | "人間の里" | "迷いの竹林" |
  "永遠亭" | "無名の丘" | "太陽の畑" | "三途の河" |
  "彼岸" | "山の麓" | "妖怪の山" | "守矢神社" | "温泉" |
  "天界" | "地上と地底を繋ぐ橋" | "地底の旧都" | "地霊殿" |
  "灼熱地獄" | "春の湊" | "命蓮寺" | "墓地" | "大祀廟" |
  "稗田家" | "香霖堂" | "冥界" | "工房"
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
function getGoods(factor: string, game: Game, player: Player): Choice<any>[] {
  if (!player.isAbleToGetSomething) return [message("品物は得られ無かった...")];
  let item = game.leftItems["品物"].pop();
  if (!item) return [message("世界に品物が残っていなかった...")]
  return [new Choice(`${factor}品物を得た `, {}, () => {
    if (item) game.gainItem(player, item);
  })];
}
function wrap1D(callback: (this: Land, game: Game, dice: number, player: Player, attrs: WithAttribute) => any) {
  return function (this: Land, game: Game, player: Player, attrs: WithAttribute): Choice<any>[] {
    return attrs.wrap(game.getDiceChoices(player, `${this.name}:1D`, d => {
      callback.bind(this)(game, d.dice, player, attrs);
    }));
  }
}
function wrap2D(callback: (this: Land, game: Game, dice: TwoDice, player: Player, attrs: WithAttribute) => any) {
  return function (this: Land, game: Game, player: Player, attrs: WithAttribute): Choice<any>[] {
    return attrs.wrap(game.getTwoDiceChoices(player, `${this.name}:2D`, d => {
      callback.bind(this)(game, d, player, attrs);
    }));
  }
}
// 属性の付与を忘れずに！
function 博麗神社1D(this: Land, game: Game, dice: number, player: Player, attrs: WithAttribute) {
  if (dice === 1) attrs.choices = 工房判定(game, player);
  else if (dice <= 3) attrs.choices = getGoods("", game, player);
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
      let target = game.players[_.shuffle<number>(w)[0]];
      attrs.choices = new Choice(
        `飲みすぎて${target.name}の戦闘履歴が初期化された`,
        {}, () => player.won.delete(target.id));
    });
  }
}
function 魔法の森2D(this: Land, game: Game, dice: TwoDice, player: Player, attrs: WithAttribute) {
  if (dice.a !== dice.b) {
    player.choices = [message("毒茸を食べなかった！")];
    return;
  }
  attrs.with("毒茸", "残機減少").choices = new Choice("うっかり毒茸を食べてしまい残機減少", {}, () => {
    game.damaged(player);
  });
}
function 月夜の森1D(this: Land, game: Game, dice: number, player: Player, attrs: WithAttribute) {
  if (dice <= player.level) {
    player.choices = [message("妖怪に攻撃されなかった！ ")];
    return;
  }
  attrs.choices = new Choice("妖怪に攻撃されたけど未実装だった！", {}, () => { })
}
// 属性の付与を忘れずに！
function 霧の湖1D(this: Land, game: Game, dice: number, player: Player, attrs: WithAttribute) {
  if (player.characterName === "チルノ") dice = 1;
  if (dice >= 5 && player.characterName === "パチュリー") attrs.choices = [message("5,6の出目は無視します")];
  else if (dice === 1) attrs.choices = new Choice("大妖精が仲間に成りかけたが未実装だった！", {}, () => { });
  else if (dice === 2) attrs.choices = getGoods("", game, player);
  else if (dice === 3) attrs.choices = happenEvent(game, player);
  else if (dice === 4) attrs.choices = happenAccident(game, player);
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
      nextTo: ["迷いの竹林", "香霖堂"],
      whenEnter: wrap2D(魔法の森2D),
      attributeHooks: [invalidate("", ["幻覚"], p => p.characterName === "魔理沙")]
    },
    {
      name: "月夜の森",
      landAttributes: ["森マス"],
      ignores: ["ルーミア"],
      nextTo: ["霧の湖", "無何有の郷", "山の麓"],
      whenEnter: wrap1D(月夜の森1D)
    },
    {
      name: "霧の湖",
      landAttributes: ["水マス"],
      powerUp: { addOneCard: ["チルノ"] },
      nextTo: ["月夜の森", "紅魔館入口", "山の麓"],
      whenEnter: wrap1D(霧の湖1D)
    },
    { name: "紅魔館入口", nextTo: ["霧の湖"], },
    { name: "図書館", nextTo: [], },
    { name: "紅魔館", nextTo: [], },
    { name: "無何有の郷", nextTo: ["月夜の森", "マヨヒガの森", "人間の里", "温泉"], },
    { name: "マヨヒガの森", nextTo: ["無何有の郷", "山の麓"], },
    { name: "白玉楼", nextTo: ["冥界"], },
    { name: "川の畔の草原", nextTo: ["夜雀の屋台", "人間の里"], },
    { name: "夜雀の屋台", nextTo: ["川の畔の草原", "人間の里"], },
    {
      name: "人間の里",
      nextTo: ["無何有の郷", "川の畔の草原", "夜雀の屋台", "迷いの竹林", "春の湊", "命蓮寺", "稗田家", "香霖堂"],
    },
    { name: "迷いの竹林", nextTo: ["魔法の森", "人間の里", "永遠亭"], },
    { name: "永遠亭", nextTo: ["迷いの竹林"], },
    { name: "無名の丘", nextTo: ["太陽の畑", "山の麓"], },
    { name: "太陽の畑", nextTo: ["無名の丘", "山の麓"], },
    { name: "三途の河", nextTo: ["彼岸", "冥界"], },
    { name: "彼岸", nextTo: ["三途の河", "冥界"], },
    { name: "山の麓", nextTo: ["月夜の森", "霧の湖", "マヨヒガの森", "無名の丘", "太陽の畑", "妖怪の山", "工房"], },
    { name: "妖怪の山", nextTo: ["山の麓", "守矢神社"], },
    { name: "守矢神社", nextTo: ["妖怪の山"], },
    { name: "天界", nextTo: ["冥界"], },
    { name: "温泉", nextTo: ["博麗神社", "無何有の郷", "地上と地底を繋ぐ橋"], },
    { name: "地上と地底を繋ぐ橋", nextTo: ["地底の旧都", "温泉"], },
    { name: "地底の旧都", nextTo: ["地上と地底を繋ぐ橋", "地霊殿"], },
    { name: "地霊殿", nextTo: ["地底の旧都"], },
    { name: "灼熱地獄", nextTo: [], },
    { name: "春の湊", nextTo: ["人間の里", "命蓮寺"], },
    { name: "命蓮寺", nextTo: ["人間の里", "墓地", "大祀廟"], },
    { name: "墓地", nextTo: ["命蓮寺", "大祀廟", "冥界"], },
    { name: "大祀廟", nextTo: ["命蓮寺", "墓地"], },
    { name: "稗田家", nextTo: ["人間の里"], },
    { name: "香霖堂", nextTo: ["魔法の森", "人間の里"], },
    { name: "冥界", nextTo: ["白玉楼", "三途の河", "彼岸", "天界", "墓地"], },
    { name: "工房", nextTo: ["山の麓"], },
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
