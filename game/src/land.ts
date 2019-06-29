import { Game } from "./game";
import { Player } from "./player";
import { Choice, message, nop, messages, choices } from "./choice";
import { AttributeHook, Attribute, invalidate, WithAttribute, TwoDice } from "./hook";
import * as _ from "underscore";
import { CharaName } from "./character";
import { ItemName, ItemCategory } from "./item";
import { randomPick, random } from "./util";
import { Pos } from "./pos";

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
  whenEnter?: (this: Land, game: Game, player: Player, attrs: WithAttribute) => Choice[];
  whenExit?: (this: Land, game: Game, player: Player, attrs: WithAttribute) => Choice[];
}
// 工房とかの判定
function judgefunction(game: Game, player: Player, waitCount: number, itemNames: ItemName[], landName: LandName, category: ItemCategory): Choice[] {
  function pick<T>(a: number, b: number, arr: T[]): T | null {
    [a, b] = [Math.max(a, b), Math.min(a, b)];
    if (b === 1) {
      if (a === 2) return arr[0];
      if (a === 3) return arr[1];
      if (a === 5) return arr[2];
      if (a === 6) return arr[3];
    }
    if (b === 2) {
      if (a === 3) return arr[4];
      if (a === 4) return arr[5];
      if (a === 6) return arr[6];
    }
    if (b === 3) {
      if (a === 4) return arr[7];
      if (a === 5) return arr[8];
    }
    if (b === 4) {
      if (a === 5) return arr[9];
      if (a === 6) return arr[10];
    }
    if (b === 5) {
      if (a === 6) return arr[11];
    }
    return null;
  }
  return game.getTwoDiceChoices(player, landName + "判定をした！ ", d => {
    let [a, b] = [Math.max(d.a, d.b), Math.min(d.a, d.b)];
    let anythingChoice = new Choice(`好きな${category}を得る！`, () => {
      let lefts = game.leftItems[category];
      if (lefts.length === 0) player.choices = messages(`${category}が一つも${landName}に残ってなかった...`);
      else player.choices = lefts.map(left => new Choice(left.name + "を得る", () => {
        let item = lefts.filter(x => x.name === left.name)[0];
        game.leftItems[category] = lefts.filter(x => x.name !== left.name);
        game.gainItem(player, item);
      }));
    });
    let goodsChoice = getGoods("", game, player);
    function pickChoice(a: number, b: number): Choice {
      let target = pick(a, b, itemNames);
      [a, b] = [Math.max(a, b), Math.min(a, b)];
      if (a === b) return anythingChoice;
      if (a - b === 3) return goodsChoice;
      return new Choice(`${target}を得る`, () => {
        if (game.leftItems[category].some(x => x.name === target)) {
          let lefts = game.leftItems[category];
          let item = lefts.filter(x => x.name === target)[0];
          game.leftItems[category] = lefts.filter(x => x.name !== target);
          game.gainItem(player, item);
        } else {
          player.choices = messages(`${target}は${landName}に残ってなかった...`)
        }
      })
    }
    if (waitCount <= 1) player.choices = [pickChoice(a, b)];
    else if (waitCount >= 3) player.choices = [anythingChoice, goodsChoice];
    else if (a - b <= 1) player.choices = [anythingChoice];
    // 品物 が２つ同じ選択肢になるけど許して
    else player.choices = [[-1, 0], [0, 0], [1, 0], [0, 1], [0, -1]]
      .map(d => [a + d[0], b + d[1]])
      .filter(x => x[0] >= 1 && x[1] >= 1 && x[0] <= 6 && x[1] <= 6)
      .map(x => pickChoice(x[0], x[1]))
  })
}
export const judgeTable = {
  "工房"(game: Game, player: Player, waitCount: number): Choice[] {
    let inventions: ItemName[] = [
      "リボン", "デジカメ", "河童のリュック", "手作りの人形",
      "ドロワーズ", "光学迷彩スーツ", "猫車", "PAD",
      "のびーるアーム", "もんぺ", "携帯電話", "ミニ八卦炉"];
    return judgefunction(game, player, waitCount, inventions, "工房", "発明品");
  },
  "図書館"(game: Game, player: Player, waitCount: number): Choice[] {
    let inventions: ItemName[] = [
      "呪法書", "スペカ事典", "同人誌", "幻想郷の歩き方",
      "超整理術", "鉄人レシピ", "スポ根漫画", "エア巻物",
      "カリスマの秘訣", "武術指南書", "文々。新聞", "求聞史記"];
    return judgefunction(game, player, waitCount, inventions, "図書館", "本");
  },
  "香霖堂"(game: Game, player: Player, waitCount: number): Choice[] {
    let inventions: ItemName[] = [
      "浄玻璃の鏡", "天狗の腕章", "聖の宝塔", "神社の御札",
      "ZUN帽", "銘酒", "死神の舟", "蓬莱の薬",
      "宝剣", "船幽霊の柄杓", "羽衣", "妖怪の傘"];
    return judgefunction(game, player, waitCount, inventions, "図書館", "本");
  }
}
// 無作為に一つアイテムを落とす
function randomDropItem(context: string, game: Game, player: Player): Choice {
  return new Choice(context + "アイテムを1個無作為で失なう", () => {
    if (player.items.length <= 0) player.choices = messages("アイテムを持ってなかった...")
    else {
      let target = randomPick(player.items);
      player.choices = choices(`${target.name}を失った...`, () => {
        game.sendBackItem(player, target);
      })
    }
  });
}
// 無作為に戦闘履歴(= 正体確認 + 戦闘勝利)が初期化
function randomForgetWin(context: string, game: Game, player: Player): Choice {
  return new Choice(context + "戦闘履歴が無作為に一人分初期化される", () => {
    let w = _.uniq(player.wonArray.concat(player.watchedArray));
    if (w.length <= 0) {
      player.choices = messages("初期化される戦闘履歴が無かった...");
      return;
    }
    let target = game.players[randomPick(w)];
    player.choices = choices(`${target.name}への戦闘履歴が初期化された`, () => {
      player.won.delete(target.id);
      player.watched.delete(target.id);
    });
  });
}
// 無作為に正体確認
function randomWatch(context: string, game: Game, player: Player, afterAction?: () => any): Choice {
  return new Choice(context + "ランダムに他者1人の正体が分かる！ ", () => {
    let yets = game.players.filter(x => !player.watched.has(x.id));
    if (yets.length === 0) {
      player.choices = choices("全員の正体を知っていた...", () => {
        if (afterAction) afterAction();
      });
    } else {
      let other = randomPick(yets);
      player.choices = choices(`${other.name}の正体を知った！ `, () => {
        game.watch(player, other);
        if (afterAction) afterAction();
      });
    }
  });
}

function happenEvent(game: Game, player: Player, attributes: Attribute[]): Choice[] {
  return game.getTwoDiceChoices(player, "イベントが起きた！ ", d => {
    let x = d.a + d.b;
    let choice: Choice;
    if (x === 2) choice = new Choice("点が集まった。残機が1増える。", () => { player.heal(); });
    else if (x === 3) choice = new Choice("香霖堂の仕入れを手伝った。手番はここで終了。", () => {
      player.isAbleToAction = false;
      player.choices = judgeTable["香霖堂"](game, player, 1);
    })
    else if (x === 4) choice = randomDropItem("落とし物をしてしまった。", game, player);
    else if (x === 5) choice = randomWatch("賢者に会った。手番はここで終了。", game, player, () => {
      player.isAbleToAction = false;
    })
    else if (x === 6) choice = new Choice("お茶の時間を楽しんだ。", () => {
      let sames = game.getPlayersAt(player.pos);
      if (sames.length <= 1) return;
      for (let same of sames) {
        same.choices = choices("お茶会で残機が1増えて手番が終了した！ ", () => {
          player.heal();
          player.isAbleToAction = false;
        })
      }
    });
    // TODO: まだ
    else if (x === 7) choice = message("未実装の魔法使いに会った。自身・アイテムの呪いを全て解いてもらう事ができる。呪いを解いてもらったら、手番はここで終了。")
    else if (x === 8) choice = getGoods("持ち主の判らない落とし物を見つけた。", game, player);
    else if (x === 9) choice = new Choice("ボムの星を手に入れた。ボムが1増える。", () => { player.healBomb(); })
    else if (x === 10) choice = new Choice("河童達の研究を手伝った。手番はここで終了。", () => {
      player.isAbleToAction = false;
      player.choices = judgeTable["工房"](game, player, 1);
    });
    else if (x === 11) choice = new Choice("図書館の蔵書整理を手伝った。手番はここで終了。", () => {
      player.isAbleToAction = false;
      player.choices = judgeTable["図書館"](game, player, 1);
    });
    else choice = new Choice("スキマツアー。盤面上の開かれた任意のマスに出現する。", () => {
      let openMat = _.range(6).map(x => _.range(6).filter(y => game.map[x][y] !== null).map(y => {
        let map = game.map[x][y];
        return { x: x, y: y, name: map ? map.name : "" }
      }));
      player.choices = [];
      openMat.forEach(ms => {
        player.choices.push(...ms.map(m => new Choice(`スキマツアー (${m.name})`, () => {
          game.enterLand(player, new Pos(m.x, m.y));
        })))
      })
    })
    // 初期化チェック便利〜〜〜〜〜〜〜〜〜〜〜〜
    player.with(...attributes).choices = [choice];
  })
}

function happenAccident(game: Game, player: Player, attributes: Attribute[]): Choice[] {
  return game.getTwoDiceChoices(player, "アクシデントが起きた！ ", dice => {
    let d = dice.a + dice.b;
    let attrs = player.with(...attributes);
    if (d === 2) attrs.choices = choices("誰かとぶつかり階段から転げ落ちた。キャラシートが入れ替わるかも！", () => {
      let others = game.getOthersAtSamePos(player);
      if (others.length <= 0) {
        player.choices = messages("同じマスに別のPCは居なかった...");
        return;
      }
      let other = randomPick(others);
      // 対象に選ばれたキャラクターが地形効果無効(巨大化茸など)だった場合、無効にできそう
      other.with(...attributes).choices = choices(`${player.name}とキャラクターが入れ替わる！ `, () => {
        player.swapCharacterWithAnotherPlayer(other);
        player.choices = messages(`${other.name} とキャラが入れ替わった！ `);
        other.choices = messages(`${player.name} とキャラが入れ替わった！ `);
      })
    })
    else if (d === 3) attrs.choices = choices("大ナマズが暴れた!地形が破壊される！ ", () => {
      game.getDiceChoices(player, `1Dで 1:左,2:上,3:右,4:下,5~6: 足元！`, d => {
        let poses = [[-1, 0], [0, -1], [1, 0], [0, 1], [0, 0], [0, 0]]
          .map(x => new Pos(player.pos.x + x[0], player.pos.y + x[1]))
          .filter(p => !p.isOutOfLand());
        poses.forEach(p => game.destroyLand(p, ["大ナマズ", ...attributes]));
      })
    })
    else if (d === 4) attrs.with("飲み過ぎ").choices = [randomForgetWin("つい飲み過ぎて前後不覚になってしまった。", game, player)];
    else if (d === 5) attrs.with("妖精", "幻覚").choices =
      choices("妖精に悪戯される。同じもしくは縦横で隣接したマスの他のPCと、所持アイテム1個が無作為に入れ替わる", () => {
        let others = game.getOthersAtNextToOrSamePos(player).filter(x => x.items.length > 0);
        if (others.length <= 0) {
          player.choices = messages("近くにアイテムを持ったPCが居なかった...");
        } else if (player.items.length === 0) {
          player.choices = messages("アイテムを持っていなかった...");
        } else { // 他者が耐性を持っていた場合無効化できる
          let other = randomPick(others);
          other.with("妖精", "幻覚", ...attributes).choices = choices(`妖精のせいで ${player.name} とアイテムが入れ替わる！`, () => {
            player.swapItem(other, random(player.items.length), random(other.items.length));
          })
        }
      })
    // TODO:
    else if (d === 6) attrs.choices = messages("未実装の妖怪に攻撃される。 勝ったら品物を1個得る。敗れるとアイテムを1個奪われる。(無ければ残機が1減る)");
    // TODO:
    else if (d === 7) attrs.choices = messages("未実装の天狗警備隊に捕まる(属性Gの者には無効) 。2D≦レベルで脱出。次の手番の始めは2D≦精神力。その次で釈放。");
    // TODO:
    else if (d === 8) attrs.choices = messages("未実装の幽霊に攻撃される。 敗れるとアイテムを1個奪われる。(無ければ残機が1減る");
    else if (d === 9) attrs.choices = choices("アイテムを永久に借りられてしまった！", () => {
      let others = game.getOthersAtSamePos(player);
      if (others.length <= 0) {
        player.choices = messages("同じマスに他のPCが居なかったので借りられなかった！ ");
      } else if (player.items.length <= 0) {
        player.choices = messages("アイテムを持っていなかった...")
      } else {
        let other = randomPick(others);
        other.with(...attributes).choices = choices(`${player.name}のアイテムを永久に借りられるぞ！ `, () => {
          if (other.characterName !== "魔理沙")
            game.stealItem(other, player, randomPick(player.items));
          else {  // 好きなものを奪える
            other.choices = player.items.map(item =>
              new Choice(`魔理沙は好きなアイテムを奪える！${item.name}を奪う！ `, () => {
                game.stealItem(other, player, item);
              }))
          }
        })
      }
    })
    else if (d === 10) attrs.with("スキマ送り").choices = choices("スキマ送りにされた。右隣のPCと駒の位置が入れ替わる！", () => {
      let other = game.getPrePlayer(player);
      other.with("スキマ送り", ...attributes).choices = choices(`${player.name}と入れ替わる！`, () => {
        player.swapPosition(other);
      });
    });
    else if (d === 11) attrs.choices = choices("大ナマズが暴れた!", () => {
      game.players.filter(p => !p.pos.isOutOfLand()).forEach(p => {
        game.getTwoDiceChoices(p, "場に居るPCは全員、2D > 精神力で残機が1減る。", dice => {
          if (dice.a + dice.b <= p.mental) p.choices = messages("大ナマズを回避した！ ");
          p.with("大ナマズ", ...attributes).choices = choices("大ナマズを食らった！", () => {
            game.damaged(p);
          });
        })
      })
    });
    // WARN: 文の条件
    else if (d === 12) attrs.choices = choices("蹴躓いて盛大に転んだ。所持アイテムを全て失なう", () => {
      player.items.forEach(item => game.sendBackItem(player, item));
    })
  });
}
function happenTrap(game: Game, player: Player): Choice[] {
  return messages("トラップ表は未実装だった！ ");
}
function getGoods(factor: string, game: Game, player: Player): Choice {
  if (!player.isAbleToGetSomething) return message("品物は得られ無かった...");
  let item = game.leftItems["品物"].pop();
  if (!item) return message("世界に品物が残っていなかった...")
  return new Choice(`${factor}品物を得た `, () => {
    if (item) game.gainItem(player, item);
  });
}
function wrap1D(callback: (this: Land, game: Game, dice: number, player: Player, attrs: WithAttribute) => any) {
  return function (this: Land, game: Game, player: Player, attrs: WithAttribute): Choice[] {
    return attrs.wrap(game.getDiceChoices(player, `${this.name}:1D`, d => {
      callback.bind(this)(game, d, player, attrs);
    }));
  }
}
function wrap2D(callback: (this: Land, game: Game, dice: TwoDice, player: Player, attrs: WithAttribute) => any) {
  return function (this: Land, game: Game, player: Player, attrs: WithAttribute): Choice[] {
    return attrs.wrap(game.getTwoDiceChoices(player, `${this.name}:2D`, d => {
      callback.bind(this)(game, d, player, attrs);
    }));
  }
}
// 属性の付与を忘れずに！
function 博麗神社1D(this: Land, game: Game, dice: number, player: Player, attrs: WithAttribute) {
  if (dice === 1) attrs.choices = judgeTable["工房"](game, player, 1);
  else if (dice <= 3) attrs.choices = [getGoods("", game, player)];
  else if (dice <= 5) attrs.choices = messages("外の世界の品物を発見したが使い途が判らず捨てた");
  else attrs.with("飲み過ぎ").choices = [randomForgetWin("宴会で飲みすぎて前後不覚になった", game, player)];
}
// ゾロ目で毒茸
function 魔法の森2D(this: Land, game: Game, dice: TwoDice, player: Player, attrs: WithAttribute) {
  if (dice.a !== dice.b) {
    player.choices = messages("毒茸を食べなかった！");
    return;
  }
  attrs.with("毒茸", "残機減少").choices = choices("うっかり毒茸を食べてしまい残機が減った", () => {
    game.damaged(player);
  });
}
// 妖怪に攻撃
function 月夜の森1D(this: Land, game: Game, dice: number, player: Player, attrs: WithAttribute) {
  if (dice <= player.level) {
    player.choices = messages("妖怪に攻撃されなかった！ ");
    return;
  }
  attrs.choices = messages("妖怪に攻撃されたけど未実装だった！")
}
// 属性の付与を忘れずに！
function 霧の湖1D(this: Land, game: Game, dice: number, player: Player, attrs: WithAttribute) {
  if (player.characterName === "チルノ") dice = 1;
  if (dice >= 5 && player.characterName === "パチュリー") attrs.choices = messages("5,6の出目は無視します");
  else if (dice === 1) attrs.choices = choices("大妖精が仲間に成りかけたが未実装だった！", () => { })
  else if (dice === 2) attrs.choices = [getGoods("", game, player)];
  else if (dice === 3) attrs.choices = happenEvent(game, player, attrs.attrs);
  else if (dice === 4) attrs.choices = happenAccident(game, player, attrs.attrs);
  else if (dice === 5) attrs.with("幻覚", "手番休み", "妖精").choices = messages("妖精に悪戯されたけど未実装だった！ ");
  else if (dice === 6) attrs.choices = messages("妖精に攻撃されたけど未実装だった！ ");
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
        x.whenEnter = function (this: Land, game: Game, player: Player, attrs: WithAttribute): Choice[] {
          if ((x.ignores || []).some(y => y === player.characterName)) return [];
          return original.bind(this)(game, player, attrs);
        }
      }
      if (x.whenExit) {
        let original = x.whenExit;
        x.whenExit = function (this: Land, game: Game, player: Player, attrs: WithAttribute): Choice[] {
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
