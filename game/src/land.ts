import { Game } from "./game";
import { Player } from "./player";
import { Choice, nop, choices } from "./choice";
import { AttributeHook, Attribute, invalidate, WithAttribute, TwoDice, NPCType } from "./hook";
import * as _ from "underscore";
import { CharaName, charaCategories } from "./character";
import { ItemName, ItemCategory, FairyFriendNames } from "./item";
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
export type LandAttribute = "花マス" | "森マス" | "水マス" | "紅マス" | "地マス"
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
      if (lefts.length === 0) player.choices = choices(`${category}が一つも${landName}に残ってなかった...`);
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
          player.choices = choices(`${target}は${landName}に残ってなかった...`)
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
    if (player.items.length <= 0) player.choices = choices("アイテムを持ってなかった...")
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
      player.choices = choices("初期化される戦闘履歴が無かった...");
      return;
    }
    let target = game.players[randomPick(w)];
    player.choices = choices(`${target.name}への戦闘履歴が初期化された`, () => {
      player.won.delete(target.id);
      player.watched.delete(target.id);
    });
  });
}
// 2Dでゾロ目でダメージ
function damagedOn2D(context: string, game: Game, player: Player): Choice[] {
  return game.getTwoDiceChoices(player, `${context}ゾロ目で残機減少。`, dice => {
    if (dice.a !== dice.b) player.choices = choices("平気だった！ ");
    else player.choices = choices("残機が減少した！", () => game.damaged(player));
  })
}

// 手番は終了し、次の手番は休み
// TODO:
function skipTurn(context: string, game: Game, player: Player): Choice {
  return new Choice(context + "手番は終了し、次の手番は休みだが未実装だった！ ");
}
// NPC戦闘(後でAttributeを付ける)
// TODO:
function battleWithNPC(context: NPCType, game: Game, player: Player): Choice {
  return new Choice(context + "に攻撃されたけど未実装だった！")
}
// 天狗警備隊に拘束(後でAttributeを付ける)
// TODO:
function tenguGuardian(game: Game, player: Player): Choice {
  return new Choice("天狗警備隊に拘束されたけど未実装だった！");
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
// 好きな人を正体確認
function arbitrarilyWatch(context: string, game: Game, player: Player, afterAction?: () => any): Choice {
  return new Choice(context + "他者1人の正体が分かる！ ", () => {
    let yets = game.players.filter(x => !player.watched.has(x.id));
    if (yets.length === 0) {
      player.choices = choices("全員の正体を知っていた...", () => {
        if (afterAction) afterAction();
      });
    } else {
      player.choices = yets.map(other => new Choice(`${other.name}の正体を知った！ `, () => {
        game.watch(player, other);
        if (afterAction) afterAction();
      }))
    }
  });
}

// イベント表
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
    else if (x === 5) choice = arbitrarilyWatch("賢者に会った。手番はここで終了。", game, player, () => {
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
    else if (x === 7) choice = new Choice("未実装の魔法使いに会った。自身・アイテムの呪いを全て解いてもらう事ができる。呪いを解いてもらったら、手番はここで終了。")
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
// アクシデント表
function happenAccident(game: Game, player: Player, attributes: Attribute[]): Choice[] {
  return game.getTwoDiceChoices(player, "アクシデントが起きた！ ", dice => {
    let d = dice.a + dice.b;
    let attrs = player.with(...attributes);
    if (d === 2) attrs.choices = choices("誰かとぶつかり階段から転げ落ちた。キャラシートが入れ替わるかも！", () => {
      let others = game.getOthersAtSamePos(player);
      if (others.length <= 0) {
        player.choices = choices("同じマスに別のPCは居なかった...");
        return;
      }
      let other = randomPick(others);
      // 対象に選ばれたキャラクターが地形効果無効(巨大化茸など)だった場合、無効にできそう
      other.with(...attributes).choices = choices(`${player.name}とキャラクターが入れ替わる！ `, () => {
        player.swapCharacterWithAnotherPlayer(other);
        player.choices = choices(`${other.name} とキャラが入れ替わった！ `);
        other.choices = choices(`${player.name} とキャラが入れ替わった！ `);
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
          player.choices = choices("近くにアイテムを持ったPCが居なかった...");
        } else if (player.items.length === 0) {
          player.choices = choices("アイテムを持っていなかった...");
        } else { // 他者が耐性を持っていた場合無効化できる
          let other = randomPick(others);
          other.with("妖精", "幻覚", ...attributes).choices = choices(`妖精のせいで ${player.name} とアイテムが入れ替わる！`, () => {
            player.swapItem(other, random(player.items.length), random(other.items.length));
          })
        }
      })
    else if (d === 6) attrs.choices = [battleWithNPC("NPC妖怪", game, player)]
    else if (d === 7) attrs.choices = [tenguGuardian(game, player)]
    else if (d === 8) attrs.choices = [battleWithNPC("NPC幽霊", game, player)]
    else if (d === 9) attrs.choices = choices("アイテムを永久に借りられてしまった！", () => {
      let others = game.getOthersAtSamePos(player);
      if (others.length <= 0) {
        player.choices = choices("同じマスに他のPCが居なかったので借りられなかった！ ");
      } else if (player.items.length <= 0) {
        player.choices = choices("アイテムを持っていなかった...")
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
          if (dice.a + dice.b <= p.mental) p.choices = choices("大ナマズを回避した！ ");
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
// トラップ表
function happenTrap(game: Game, player: Player, attributes: Attribute[]): Choice[] {
  return game.getTwoDiceChoices(player, "トラップが発動した！  ", dice => {
    let d = dice.a + dice.b;
    let attrs = player.with(...attributes);
    if (d === 2) attrs.choices = [battleWithNPC("NPCランダムキャラ", game, player)]
    else if (d === 3) attrs.with("毒茸").choices = game.getTwoDiceChoices(player, "毒茸を食べてしまう。2D > 精神力で残機が1減る", dice => {
      if (dice.a + dice.b <= player.mental) player.choices = choices("毒茸を食べたが大丈夫だった！");
      else player.choices = choices("毒茸を食べてしまって残機が減った...", () => game.damaged(player));
    });
    else if (d === 4) attrs.choices = [battleWithNPC("NPC神様", game, player)]
    else if (d === 5) attrs.choices = [tenguGuardian(game, player)]
    else if (d === 6) attrs.with("落とし穴").choices = choices("落とし穴に落ちてアイテムをばら撒く。同じマスに他のPCが居れば、所持アイテムが無作為に1個入れ替わる。", () => {
      let others = game.getOthersAtSamePos(player).filter(x => x.items.length > 0);
      if (others.length <= 0) {
        player.choices = choices("近くにアイテムを持ったPCが居なかった...");
      } else if (player.items.length === 0) {
        player.choices = choices("アイテムを持っていなかった...");
      } else { // 他者が耐性を持っていた場合無効化できる
        let other = randomPick(others);
        other.with(...attributes).choices = choices(`${player.name} とアイテムが入れ替わった！`, () => {
          player.swapItem(other, random(player.items.length), random(other.items.length));
        })
      }
    });
    // TODO:
    else if (d === 7) attrs.with("妖精", "幻覚").choices = choices("未実装の妖精達に悪戯される。次の移動は1Dで 1: 左  2: 上  3: 右  4: 下  5~6: 任意の方向 に進む")
    // WARN: アイテムを落とす属性
    else if (d === 8) attrs.choices = [randomDropItem("罠を回避した時にアイテムを落として壊してしまった。", game, player)];
    // TODO:
    else if (d === 9) attrs.with("呪い").choices = choices("未実装の゙バカになる呪いを受ける。次の自分の手番終了時まで、レベル1 精神力9 になる。");
    else if (d === 10) attrs.choices = choices("金ダライが降ってきた！ ", () => {
      game.getPlayersAt(player.pos).forEach(x => {
        x.with(...attributes).choices = game.getDiceChoices(x, "1D > レベルで残機が1減る！", d => {
          if (d <= x.level) x.choices = choices("金ダライを回避した！ ")
          else x.choices = choices("金ダライが当たった！", () => game.damaged(x))
        })
      })
    })
    // TODO:
    else if (d === 11) attrs.with("スキマ送り").choices = choices("未実装のスキマ送りにされた。駒を盤外に移し、次の手番開始時に開かれたマスに無作為に出現。※5")
    // TODO:
    else if (d === 12) attrs.with("落とし穴", "残機減少").choices = choices("未実装の落とし穴に落ちる。残機が1減り、地形「地上と地底を繋ぐ橋」が出ていれば、次の手番にそこへ移動する。")
  })
}
function getGoods(factor: string, game: Game, player: Player): Choice {
  if (!player.isAbleToGetSomething) return new Choice("品物は得られ無かった...");
  let item = game.leftItems["品物"].pop();
  if (!item) return new Choice("世界に品物が残っていなかった...")
  return new Choice(`${factor}品物を得た `, () => {
    if (item) game.gainItem(player, item);
  });
}
function wrap1D(callback: (this: Land, game: Game, dice: number, player: Player, attrs: WithAttribute) => any) {
  return function (this: Land, game: Game, player: Player, attrs: WithAttribute): Choice[] {
    return attrs.wrap(game.getDiceChoices(player, `${this.name}に入った1D`, d => {
      callback.bind(this)(game, d, player, attrs);
    }));
  }
}
function wrap2D(callback: (this: Land, game: Game, dice: TwoDice, player: Player, attrs: WithAttribute) => any) {
  return function (this: Land, game: Game, player: Player, attrs: WithAttribute): Choice[] {
    return attrs.wrap(game.getTwoDiceChoices(player, `${this.name}に入った2D`, d => {
      callback.bind(this)(game, d, player, attrs);
    }));
  }
}


export function getLands(): Land[] {
  // WARN: fullText 要る？？
  let tmp: LandBase[] = [
    {
      name: "博麗神社",
      nextTo: ["温泉"],
      landAttributes: ["花マス"],
      powerUp: { addOneCard: ["霊夢", "萃香"] },
      attributeHooks: [invalidate("博麗神社+人間", ["能力低下"], p => p.race === "人間")],
      whenEnter: wrap1D((game: Game, dice: number, player: Player, attrs: WithAttribute) => {
        if (dice === 1) attrs.choices = judgeTable["工房"](game, player, 1);
        else if (dice <= 3) attrs.choices = [getGoods("", game, player)];
        else if (dice <= 5) attrs.choices = choices("外の世界の品物を発見したが使い途が判らず捨てた");
        else attrs.with("飲み過ぎ").choices = [randomForgetWin("宴会で飲みすぎて前後不覚になった", game, player)];
      }),
    }, {
      name: "魔法の森",
      nextTo: ["迷いの竹林", "香霖堂"],
      landAttributes: ["森マス"],
      ignores: ["魔理沙", "アリス"],
      powerUp: { addOneCard: ["魔理沙", "アリス"] },
      attributeHooks: [invalidate("魔法の森", ["幻覚"], p => p.characterName === "魔理沙")],
      // TODO: 人間・妖怪は、精神力が1下がる。(能力低下)　
      // TODO: 出る時に1D
      whenEnter: wrap2D((game: Game, dice: TwoDice, player: Player, attrs: WithAttribute) => {
        if (dice.a !== dice.b)
          player.choices = choices("毒茸を食べなかった！");
        else attrs.with("毒茸", "残機減少").choices = choices("うっかり毒茸を食べてしまい残機が減った", () => {
          game.damaged(player);
        });
      }),
    }, {
      name: "月夜の森",
      nextTo: ["霧の湖", "無何有の郷", "山の麓"],
      landAttributes: ["森マス"],
      ignores: [...charaCategories["バカルテット"], ...charaCategories["紅魔館の住人"]],
      powerUp: { levelUp: ["ルーミア"] },
      whenEnter: wrap1D((game: Game, dice: number, player: Player, attrs: WithAttribute) => {
        if (dice <= player.level) attrs.choices = choices("妖怪に攻撃されなかった！ ");
        else attrs.choices = [battleWithNPC("NPC妖怪", game, player)]
      }),
    }, {
      name: "霧の湖",
      landAttributes: ["水マス"],
      powerUp: { addOneCard: ["チルノ"] },
      nextTo: ["月夜の森", "紅魔館入口", "山の麓"],
      whenEnter: wrap1D((game: Game, dice: number, player: Player, attrs: WithAttribute) => {
        if (player.characterName === "チルノ") dice = 1;
        let friend = player.friend;
        if (dice >= 5 && (
          charaCategories["紅魔館の住人"].includes(player.characterName)
          || (friend ? FairyFriendNames.includes(friend.name) : false))
        ) attrs.choices = choices("5,6の出目は無視します");
        else if (dice === 1) attrs.choices = choices("大妖精を仲間にできる！ ", () => game.gainFriend(player, "大妖精"));
        else if (dice === 2) attrs.choices = [getGoods("", game, player)];
        else if (dice === 3) attrs.choices = happenEvent(game, player, attrs.attrs);
        else if (dice === 4) attrs.choices = happenAccident(game, player, attrs.attrs);
        else if (dice === 5) attrs.with("幻覚", "妖精").choices = [skipTurn("妖精に悪戯された", game, player)];
        else if (dice === 6) attrs.choices = [battleWithNPC("NPC妖精", game, player)];
      }),
    }, {
      name: "紅魔館入口",
      nextTo: ["霧の湖"],
      powerUp: { mentalUp: ["美鈴"] },
      whenEnter: wrap1D((game: Game, dice: number, player: Player, attrs: WithAttribute) => {
        if (dice >= 5 && charaCategories["紅魔館の住人"].some(x => x === player.name))
          attrs.choices = choices("5,6の出目は無視します");
        else if (dice === 1) attrs.choices = [arbitrarilyWatch("門番と噂話をする。", game, player)];
        else if (dice <= 4) attrs.choices = choices("門番は微動だにしない。近づいて見てみたら、門番は立ったまま寝ていた。");
        // TODO:
        else attrs.choices = choices("先へ進もうとしたら、門番に怒られた。次の「移動1」「移動2」での移動時に、もと居たマスに引き返す。")
      }),
    }, {
      name: "図書館",
      nextTo: [],
      powerUp: { addOneCard: ["パチュリー"] }
    }, {
      name: "紅魔館",
      nextTo: [],
      powerUp: { addOneCard: charaCategories["紅魔館の住人"] },
      whenEnter: wrap1D((game: Game, dice: number, player: Player, attrs: WithAttribute) => {
        if (player.characterName === "パチュリー") dice = 1;
        else if (charaCategories["紅魔館の住人"].includes(player.characterName)) dice = Math.max(1, dice - 2)
        if (dice === 1) attrs.choices = choices("小悪魔を仲間にできる！ ", () => game.gainFriend(player, "小悪魔"));
        else if (dice === 2) attrs.choices = [getGoods("", game, player)];
        else if (dice <= 4) attrs.choices = choices("何も起きなかった");
        // TODO: 「手番はここで終了」と「次の手番は休み」は違う
        else if (dice === 5) attrs.choices = choices("手番は終了し、2D>精神力で次の手番は休み。");
        else if (dice === 6) attrs.with("残機減少").choices = choices("「きゅっとしてドカーン」された。残機が1減る。", () => game.damaged(player));
      }),
    }, {
      name: "無何有の郷",
      nextTo: ["月夜の森", "マヨヒガの森", "人間の里", "温泉"],
      powerUp: { addOneCard: ["レティ"] },
      attributeHooks: [invalidate("無何有の郷", ["能力低下"], p => ["レティ", "チルノ"].includes(p.characterName))],
      whenEnter: wrap1D((game: Game, dice: number, player: Player, attrs: WithAttribute) => {
        if (dice >= 5 && ["レティ", "チルノ"].includes(player.characterName))
          attrs.choices = choices("5,6の出目は無視します");
        else if (dice === 1) attrs.choices = choices("三月精を仲間にできる！ ", () => game.gainFriend(player, "三月精"));
        else if (dice === 2) attrs.choices = choices("ボムを得る", () => player.healBomb());
        else if (dice === 3) attrs.choices = [getGoods("", game, player)];
        else if (dice === 4) attrs.choices = happenEvent(game, player, attrs.attrs);
        else if (dice === 5) attrs.choices = happenAccident(game, player, attrs.attrs);
        else if (dice === 6) attrs.choices = happenTrap(game, player, attrs.attrs);
      })
    }, { // TODO:
      name: "マヨヒガの森",
      nextTo: ["無何有の郷", "山の麓"],
    }, {
      name: "白玉楼",
      nextTo: ["冥界"],
      powerUp: { addOneCard: ["幽々子", "妖夢"] },
      whenEnter: wrap2D((game: Game, dice: TwoDice, player: Player, attrs: WithAttribute) => {
        let d = dice.a + dice.b;
        if (player.life === 1 && d <= player.mental) attrs.choices = choices("残機が回復した！", () => player.heal());
        else if (player.life === 2 && d <= player.level) attrs.choices = choices("残機が回復した！", () => player.heal());
        else attrs.choices = choices("何も起きなかった");
      })
    }, {
      name: "川の畔の草原",
      nextTo: ["夜雀の屋台", "人間の里"],
      powerUp: { levelUp: ["リグル"] },
      whenEnter: wrap1D((game: Game, dice: number, player: Player, attrs: WithAttribute) => {
        if ((dice >= 4 && player.characterName === "リグル") ||
          dice >= 5 && player.race === "幽霊")
          attrs.choices = choices("ダイスの出目を無視した！");
        else if (dice === 1) attrs.choices = choices("ボムを得る", () => player.healBomb());
        else if (dice === 2) attrs.choices = [getGoods("", game, player)];
        else if (dice === 3) attrs.choices = happenEvent(game, player, attrs.attrs);
        else if (dice === 4) attrs.choices = happenAccident(game, player, attrs.attrs);
        else if (dice === 5) attrs.choices = [skipTurn("蚤に咬まれてしまった", game, player)]
        else if (dice === 6) attrs.choices = damagedOn2D("恙虫(ツツガムシ)に咬まれてしまった。", game, player);
      })
    }, {
      name: "夜雀の屋台",
      nextTo: ["川の畔の草原", "人間の里"],
      powerUp: { levelUp: ["ミスティア"] },
      whenEnter: wrap1D((game: Game, dice: number, player: Player, attrs: WithAttribute) => {
        if (dice === 1) attrs.choices = choices("美味しい！ 残機回復！ ", () => player.heal());
        else if (dice === 2) attrs.choices = choices("ボムを得る", () => player.healBomb());
        else if (dice === 3) attrs.choices = [arbitrarilyWatch("店主と噂話をする。", game, player)];
        else if (dice === 4) attrs.choices = choices("何も起きなかった...");
        else if (dice === 5) attrs.with("飲み過ぎ").choices = [randomDropItem("飲み過ぎてしまった。", game, player)];
        else if (dice === 6) attrs.with("食あたり").choices = damagedOn2D("食あたりを起こした。", game, player);
      })
    }, {
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
