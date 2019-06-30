import { Game } from "./game"
import { Player } from "./player"
import { Choice, nop, choices } from "./choice"
import { AttributeHook, Attribute, invalidate, WithAttribute, TwoDice, NPCType } from "./hook"
import * as _ from "underscore"
import { CharaName, charaCategories } from "./character"
import { ItemName, ItemCategory, FairyFriendNames, FriendName } from "./item"
import { randomPick, random } from "./util"
import { Pos } from "./pos"

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
  addOneCard?: CharaName[]
  levelUp?: CharaName[]
  mentalUp?: CharaName[]
}
type LandBase = {
  id?: number
  name: LandName
  nextTo: LandName[]
  attributeHooks?: AttributeHook[]
  landAttributes?: LandAttribute[]
  ignores?: CharaName[] // 「上記効果無効」のキャラリスト
  powerUp?: PowerUp
  whenEnter?: (this: EventWrapper) => Choice[]
  whenExit?: (this: EventWrapper) => Choice[]
}
export class EventWrapper {
  game: Game
  player: Player
  constructor(game: Game, player: Player) {
    this.game = game
    this.player = player
  }
  // 手番は終了し、次の手番は休み
  // TODO:
  skipTurn(context: string, isSkipNextTurn: boolean = true): Choice {
    return new Choice(context + "手番は終了し、次の手番は休みだが未実装だった！ ")
  }
  // NPC戦闘(後でAttributeを付ける)
  // TODO:
  battleWithNPC(context: NPCType): Choice {
    return new Choice(context + "に攻撃されたけど未実装だった！")
  }
  // 天狗警備隊に拘束(後でAttributeを付ける)
  // TODO:
  tenguGuardian(): Choice {
    return new Choice("天狗警備隊に拘束されたけど未実装だった！")
  }
  nameIsIn(charaNames: CharaName[]) {
    return charaNames.includes(this.player.characterName)
  }
  //
  // 無作為に一つアイテムを落とす
  randomDropItem(context: string): Choice {
    let player = this.player
    return new Choice(context + "アイテムを1個無作為で失なう", () => {
      if (player.items.length <= 0) player.choices = choices("アイテムを持ってなかった...")
      else {
        let target = randomPick(player.items)
        player.choices = choices(`${target.name}を失った...`, () => {
          this.game.sendBackItem(player, target)
        })
      }
    })
  }
  // 全てのアイテムを落とす
  dropAllItems(context: string): Choice {
    return new Choice(context + "所持アイテムを全て失なう", () => {
      this.player.items.forEach(item => this.game.sendBackItem(this.player, item))
    })
  }
  // 無作為に戦闘履歴(= 正体確認 + 戦闘勝利)が初期化
  randomForgetWin(context: string): Choice {
    let player = this.player
    return new Choice(context + "戦闘履歴が無作為に一人分初期化される", () => {
      let w = _.uniq(player.wonArray.concat(player.watchedArray))
      if (w.length <= 0) {
        player.choices = choices("初期化される戦闘履歴が無かった...")
        return
      }
      let target = this.game.players[randomPick(w)]
      player.choices = choices(`${target.name}への戦闘履歴が初期化された`, () => {
        player.won.delete(target.id)
        player.watched.delete(target.id)
      })
    })
  }
  // 2Dでゾロ目でダメージ
  damagedOn2D(context: string): Choice[] {
    let player = this.player
    return this.game.getTwoDiceChoices(player, `${context}ゾロ目で残機減少。`, dice => {
      if (dice.a !== dice.b) player.choices = choices("平気だった！ ")
      else player.choices = choices("残機が減少した！", () => this.game.damaged(player))
    })
  }
  swapRandomCharacter(context: string): Choice {
    if (this.player.role === "主人公") {
      return new Choice(context + "しかし主人公は転生しなかった...")
    }
    return new Choice(context + "キャラシートを交換した！ ", () => {
      this.player.swapRandomCharacter();
    });
  }
  // 無作為に正体確認
  randomWatch(context: string, afterAction?: () => any): Choice {
    let player = this.player
    return new Choice(context + "ランダムに他者1人の正体が分かる！ ", () => {
      let yets = this.game.players.filter(x => !player.watched.has(x.id))
      if (yets.length === 0) {
        player.choices = choices("全員の正体を知っていた...", () => {
          if (afterAction) afterAction()
        })
      } else {
        let other = randomPick(yets)
        player.choices = choices(`${other.name}の正体を知った！ `, () => {
          this.game.watch(player, other)
          if (afterAction) afterAction()
        })
      }
    })
  }
  // 好きな人を正体確認
  arbitrarilyWatch(context: string, afterAction?: () => any): Choice {
    let player = this.player
    return new Choice(context + "他者1人の正体が分かる！ ", () => {
      let yets = this.game.players.filter(x => !player.watched.has(x.id))
      if (yets.length === 0) {
        player.choices = choices("全員の正体を知っていた...", () => {
          if (afterAction) afterAction()
        })
      } else {
        player.choices = yets.map(other => new Choice(`${other.name}の正体を知った！ `, () => {
          this.game.watch(player, other)
          if (afterAction) afterAction()
        }))
      }
    })
  }
  // 品物
  gainGoods(factor: string): Choice {
    let player = this.player
    if (!player.isAbleToGetSomething) return new Choice("品物は得られ無かった...")
    let item = this.game.leftItems["品物"].pop()
    if (!item) return new Choice("世界に品物が残っていなかった...")
    return new Choice(`${factor}品物を得た `, () => {
      if (item) this.game.gainItem(player, item)
    })
  }
  // ボム
  gainBomb(factor: string): Choice {
    return new Choice(factor + "ボムを得る", () => { this.player.healBomb() })
  }
  // 残機
  gainLife(factor: string): Choice {
    return new Choice(factor + "残機が回復！ ", () => { this.player.heal() })
  }
  // 仲間
  gainFriend(name: FriendName): Choice {
    return new Choice(`${name}を仲間にできる！ `, () =>
      this.game.gainFriend(this.player, name))
  }

  judgefunctionImpl(waitCount: number, itemNames: ItemName[], landName: LandName, category: ItemCategory): Choice[] {

    function pick<T>(a: number, b: number, arr: T[]): T | null {
      [a, b] = [Math.max(a, b), Math.min(a, b)]
      if (b === 1) {
        if (a === 2) return arr[0]
        if (a === 3) return arr[1]
        if (a === 5) return arr[2]
        if (a === 6) return arr[3]
      }
      if (b === 2) {
        if (a === 3) return arr[4]
        if (a === 4) return arr[5]
        if (a === 6) return arr[6]
      }
      if (b === 3) {
        if (a === 4) return arr[7]
        if (a === 5) return arr[8]
      }
      if (b === 4) {
        if (a === 5) return arr[9]
        if (a === 6) return arr[10]
      }
      if (b === 5) {
        if (a === 6) return arr[11]
      }
      return null
    }
    let { player, game } = this
    return game.getTwoDiceChoices(player, landName + "判定をした！ ", d => {
      let [a, b] = [Math.max(d.a, d.b), Math.min(d.a, d.b)]
      let anythingChoice = new Choice(`好きな${category}を得る！`, () => {
        let lefts = game.leftItems[category]
        if (lefts.length === 0) player.choices = choices(`${category}が一つも${landName}に残ってなかった...`)
        else player.choices = lefts.map(left => new Choice(left.name + "を得る", () => {
          let item = lefts.filter(x => x.name === left.name)[0]
          game.leftItems[category] = lefts.filter(x => x.name !== left.name)
          game.gainItem(player, item)
        }))
      })
      let goodsChoice = this.gainGoods("")
      function pickChoice(a: number, b: number): Choice {
        [a, b] = [Math.max(a, b), Math.min(a, b)]
        let target = pick(a, b, itemNames)
        if (a === b) return anythingChoice
        if (a - b === 3) return goodsChoice
        return new Choice(`${target}を得る`, () => {
          if (game.leftItems[category].some(x => x.name === target)) {
            let lefts = game.leftItems[category]
            let item = lefts.filter(x => x.name === target)[0]
            game.leftItems[category] = lefts.filter(x => x.name !== target)
            game.gainItem(player, item)
          } else {
            player.choices = choices(`${target}は${landName}に残ってなかった...`)
          }
        })
      }
      if (waitCount <= 1) player.choices = [pickChoice(a, b)]
      else if (waitCount >= 3) player.choices = [anythingChoice, goodsChoice]
      else if (a - b <= 1) player.choices = [anythingChoice]
      // 品物 が２つ同じ選択肢になるけど許して
      else player.choices = [[-1, 0], [0, 0], [1, 0], [0, 1], [0, -1]]
        .map(d => [a + d[0], b + d[1]])
        .filter(x => x[0] >= 1 && x[1] >= 1 && x[0] <= 6 && x[1] <= 6)
        .map(x => pickChoice(x[0], x[1]))
    }, false)
  }

  judge(type: "工房" | "図書館" | "香霖堂", waitCount: number): Choice[] {
    // 工房とかの判定の実装
    let { player, game } = this
    if (type === "工房")
      return this.judgefunctionImpl(waitCount, [
        "リボン", "デジカメ", "河童のリュック", "手作りの人形",
        "ドロワーズ", "光学迷彩スーツ", "猫車", "PAD",
        "のびーるアーム", "もんぺ", "携帯電話", "ミニ八卦炉"], "工房", "発明品")
    if (type === "図書館")
      return this.judgefunctionImpl(waitCount, [
        "呪法書", "スペカ事典", "同人誌", "幻想郷の歩き方",
        "超整理術", "鉄人レシピ", "スポ根漫画", "エア巻物",
        "カリスマの秘訣", "武術指南書", "文々。新聞", "求聞史記"
      ], "図書館", "本")
    return this.judgefunctionImpl(waitCount, [
      "浄玻璃の鏡", "天狗の腕章", "聖の宝塔", "神社の御札",
      "ZUN帽", "銘酒", "死神の舟", "蓬莱の薬",
      "宝剣", "船幽霊の柄杓", "羽衣", "妖怪の傘"], "香霖堂", "宝物")
  }
  // イベント表
  happenEvent(attributes: Attribute[]): Choice[] {
    let { game, player } = this
    return game.getTwoDiceChoices(player, "イベントが起きた！ ", d => {
      let x = d.a + d.b
      let choice: Choice
      if (x === 2) choice = new Choice("点が集まった。残機が1増える。", () => { player.heal() })
      else if (x === 3) choice = new Choice("香霖堂の仕入れを手伝った。手番はここで終了。", () => {
        player.isAbleToAction = false
        player.choices = this.judge("香霖堂", 1)
      })
      else if (x === 4) choice = this.randomDropItem("落とし物をしてしまった。")
      else if (x === 5) choice = this.arbitrarilyWatch("賢者に会った。手番はここで終了。", () => {
        player.isAbleToAction = false
      })
      else if (x === 6) choice = new Choice("お茶の時間を楽しんだ。", () => {
        let sames = game.getPlayersAt(player.pos)
        if (sames.length <= 1) return
        for (let same of sames) {
          same.choices = choices("お茶会で残機が1増えて手番が終了した！ ", () => {
            player.heal()
            player.isAbleToAction = false
          })
        }
      })
      // TODO: まだ
      else if (x === 7) choice = new Choice("未実装の魔法使いに会った。自身・アイテムの呪いを全て解いてもらう事ができる。呪いを解いてもらったら、手番はここで終了。")
      else if (x === 8) choice = this.gainGoods("持ち主の判らない落とし物を見つけた。")
      else if (x === 9) choice = new Choice("ボムの星を手に入れた。ボムが1増える。", () => { player.healBomb() })
      else if (x === 10) choice = new Choice("河童達の研究を手伝った。手番はここで終了。", () => {
        player.isAbleToAction = false
        player.choices = this.judge("工房", 1)
      })
      else if (x === 11) choice = new Choice("図書館の蔵書整理を手伝った。手番はここで終了。", () => {
        player.isAbleToAction = false
        player.choices = this.judge("図書館", 1)
      })
      else choice = new Choice("スキマツアー。盤面上の開かれた任意のマスに出現する。", () => {
        let openMat = _.range(6).map(x => _.range(6).filter(y => game.map[x][y] !== null).map(y => {
          let map = game.map[x][y]
          return { x: x, y: y, name: map ? map.name : "" }
        }))
        player.choices = []
        openMat.forEach(ms => {
          player.choices.push(...ms.map(m => new Choice(`スキマツアー (${m.name})`, () => {
            game.enterLand(player, new Pos(m.x, m.y))
          })))
        })
      })
      // 初期化チェック便利〜〜〜〜〜〜〜〜〜〜〜〜
      player.with(...attributes).choices = [choice]
    }, false)
  }
  // アクシデント表
  happenAccident(attributes: Attribute[]): Choice[] {
    let { player, game } = this
    return game.getTwoDiceChoices(player, "アクシデントが起きた！ ", dice => {
      let d = dice.a + dice.b
      let attrs = player.with(...attributes)
      if (d === 2) attrs.choices = choices("誰かとぶつかり階段から転げ落ちた。キャラシートが入れ替わるかも！", () => {
        let others = game.getOthersAtSamePos(player)
        if (others.length <= 0) {
          player.choices = choices("同じマスに別のPCは居なかった...")
          return
        }
        let other = randomPick(others)
        // 対象に選ばれたキャラクターが地形効果無効(巨大化茸など)だった場合、無効にできそう
        other.with(...attributes).choices = choices(`${player.name}とキャラクターが入れ替わる！ `, () => {
          player.swapCharacterWithAnotherPlayer(other)
          player.choices = choices(`${other.name} とキャラが入れ替わった！ `)
          other.choices = choices(`${player.name} とキャラが入れ替わった！ `)
        })
      })
      else if (d === 3) attrs.choices = choices("大ナマズが暴れた!地形が破壊される！ ", () => {
        game.getDiceChoices(player, `1Dで 1:左,2:上,3:右,4:下,5~6: 足元！`, d => {
          let poses = [[-1, 0], [0, -1], [1, 0], [0, 1], [0, 0], [0, 0]]
            .map(x => new Pos(player.pos.x + x[0], player.pos.y + x[1]))
            .filter(p => !p.isOutOfLand())
          poses.forEach(p => game.destroyLand(p, ["大ナマズ", ...attributes]))
        }, false)
      })
      else if (d === 4) attrs.with("飲み過ぎ").choices = [this.randomForgetWin("つい飲み過ぎて前後不覚になってしまった。")]
      else if (d === 5) attrs.with("妖精", "幻覚").choices =
        choices("妖精に悪戯される。同じもしくは縦横で隣接したマスの他のPCと、所持アイテム1個が無作為に入れ替わる", () => {
          let others = game.getOthersAtNextToOrSamePos(player).filter(x => x.items.length > 0)
          if (others.length <= 0) {
            player.choices = choices("近くにアイテムを持ったPCが居なかった...")
          } else if (player.items.length === 0) {
            player.choices = choices("アイテムを持っていなかった...")
          } else { // 他者が耐性を持っていた場合無効化できる
            let other = randomPick(others)
            other.with("妖精", "幻覚", ...attributes).choices = choices(`妖精のせいで ${player.name} とアイテムが入れ替わる！`, () => {
              player.swapItem(other, random(player.items.length), random(other.items.length))
            })
          }
        })
      else if (d === 6) attrs.choices = [this.battleWithNPC("NPC妖怪")]
      else if (d === 7) attrs.choices = [this.tenguGuardian()]
      else if (d === 8) attrs.choices = [this.battleWithNPC("NPC幽霊")]
      else if (d === 9) attrs.choices = choices("アイテムを永久に借りられてしまった！", () => {
        let others = game.getOthersAtSamePos(player)
        if (others.length <= 0) {
          player.choices = choices("同じマスに他のPCが居なかったので借りられなかった！ ")
        } else if (player.items.length <= 0) {
          player.choices = choices("アイテムを持っていなかった...")
        } else {
          let other = randomPick(others)
          other.with(...attributes).choices = choices(`${player.name}のアイテムを永久に借りられるぞ！ `, () => {
            if (other.characterName !== "魔理沙")
              game.stealItem(other, player, randomPick(player.items))
            else {  // 好きなものを奪える
              other.choices = player.items.map(item =>
                new Choice(`魔理沙は好きなアイテムを奪える！${item.name}を奪う！ `, () => {
                  game.stealItem(other, player, item)
                }))
            }
          })
        }
      })
      else if (d === 10) attrs.with("スキマ送り").choices = choices("スキマ送りにされた。右隣のPCと駒の位置が入れ替わる！", () => {
        let other = game.getPrePlayer(player)
        other.with("スキマ送り", ...attributes).choices = choices(`${player.name}と入れ替わる！`, () => {
          player.swapPosition(other)
        })
      })
      else if (d === 11) attrs.choices = choices("大ナマズが暴れた!", () => {
        game.players.filter(p => !p.pos.isOutOfLand()).forEach(p => {
          game.getTwoDiceChoices(p, "場に居るPCは全員、2D > 精神力で残機が1減る。", dice => {
            if (dice.a + dice.b <= p.mental) p.choices = choices("大ナマズを回避した！ ")
            p.with("大ナマズ", ...attributes).choices = choices("大ナマズを食らった！", () => {
              game.damaged(p)
            })
          })
        })
      })
      // WARN: 文の条件
      else if (d === 12) attrs.choices = [this.dropAllItems("蹴躓いて盛大に転んだ。")]
    }, false)
  }
  // トラップ表
  happenTrap(attributes: Attribute[]): Choice[] {
    let { player, game } = this
    return game.getTwoDiceChoices(player, "トラップが発動した！  ", dice => {
      let d = dice.a + dice.b
      let attrs = player.with(...attributes)
      if (d === 2) attrs.choices = [this.battleWithNPC("NPCランダムキャラ")]
      else if (d === 3) attrs.with("毒茸").choices = game.getTwoDiceChoices(player, "毒茸を食べてしまう。2D > 精神力で残機が1減る", dice => {
        if (dice.a + dice.b <= player.mental) player.choices = choices("毒茸を食べたが大丈夫だった！")
        else player.choices = choices("毒茸を食べてしまって残機が減った...", () => game.damaged(player))
      })
      else if (d === 4) attrs.choices = [this.battleWithNPC("NPC神様")]
      else if (d === 5) attrs.choices = [this.tenguGuardian()]
      else if (d === 6) attrs.with("落とし穴").choices = choices("落とし穴に落ちてアイテムをばら撒く。同じマスに他のPCが居れば、所持アイテムが無作為に1個入れ替わる。", () => {
        let others = game.getOthersAtSamePos(player).filter(x => x.items.length > 0)
        if (others.length <= 0) {
          player.choices = choices("近くにアイテムを持ったPCが居なかった...")
        } else if (player.items.length === 0) {
          player.choices = choices("アイテムを持っていなかった...")
        } else { // 他者が耐性を持っていた場合無効化できる
          let other = randomPick(others)
          other.with(...attributes).choices = choices(`${player.name} とアイテムが入れ替わった！`, () => {
            player.swapItem(other, random(player.items.length), random(other.items.length))
          })
        }
      })
      // TODO:
      else if (d === 7) attrs.with("妖精", "幻覚").choices = choices("未実装の妖精達に悪戯される。次の移動は1Dで 1: 左  2: 上  3: 右  4: 下  5~6: 任意の方向 に進む")
      // WARN: アイテムを落とす属性
      else if (d === 8) attrs.choices = [this.randomDropItem("罠を回避した時にアイテムを落として壊してしまった。")]
      // TODO:
      else if (d === 9) attrs.with("呪い").choices = choices("未実装の゙バカになる呪いを受ける。次の自分の手番終了時まで、レベル1 精神力9 になる。")
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
    }, false)
  }
}
// 入ったら1D
function wrap1D(landName: LandName, callback: (this: EventWrapper, dice: number, attrs: WithAttribute) => any) {
  return function (this: EventWrapper): Choice[] {
    let attrs = this.player.with("地形効果", landName)
    return attrs.wrap(this.game.getDiceChoices(this.player, `${landName}に入った1D`, d => {
      callback.bind(this)(d, attrs)
    }, false))
  }
}
// 入ったら2D
function wrap2D(landName: LandName, callback: (this: EventWrapper, dice: TwoDice, attrs: WithAttribute) => any) {
  return function (this: EventWrapper): Choice[] {
    let attrs = this.player.with("地形効果", landName)
    return attrs.wrap(this.game.getTwoDiceChoices(this.player, `${landName}に入った2D`, d => {
      callback.bind(this)(d, attrs)
    }, false))
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
      whenEnter: wrap1D("博麗神社", function (this: EventWrapper, dice: number, attrs: WithAttribute) {
        if (dice <= 1) attrs.choices = this.judge("工房", 1)
        else if (dice <= 3) attrs.choices = [this.gainGoods("")]
        else if (dice <= 5) attrs.choices = choices("外の世界の品物を発見したが使い途が判らず捨てた")
        else attrs.with("飲み過ぎ").choices = [this.randomForgetWin("宴会で飲みすぎて前後不覚になった")]
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
      whenEnter: wrap2D("魔法の森", function (this: EventWrapper, dice: TwoDice, attrs: WithAttribute) {
        if (dice.a !== dice.b) attrs.choices = choices("毒茸を食べなかった！")
        else attrs.with("毒茸", "残機減少").choices = choices("うっかり毒茸を食べてしまい残機が減った", () => {
          this.game.damaged(this.player)
        })
      }),
    }, {
      name: "月夜の森",
      nextTo: ["霧の湖", "無何有の郷", "山の麓"],
      landAttributes: ["森マス"],
      ignores: [...charaCategories["バカルテット"], ...charaCategories["紅魔館の住人"]],
      powerUp: { levelUp: ["ルーミア"] },
      whenEnter: wrap1D("月夜の森", function (this: EventWrapper, dice: number, attrs: WithAttribute) {
        if (dice <= this.player.level) attrs.choices = choices("妖怪に攻撃されなかった！ ")
        else attrs.choices = [this.battleWithNPC("NPC妖怪")]
      }),
    }, {
      name: "霧の湖",
      landAttributes: ["水マス"],
      powerUp: { addOneCard: ["チルノ"] },
      nextTo: ["月夜の森", "紅魔館入口", "山の麓"],
      whenEnter: wrap1D("霧の湖", function (this: EventWrapper, dice: number, attrs: WithAttribute) {
        if (this.nameIsIn(["チルノ"])) dice = 1
        let friend = this.player.friend
        if (dice >= 5 && (
          this.nameIsIn(charaCategories["紅魔館の住人"])
          || (friend ? FairyFriendNames.includes(friend.name) : false))
        ) attrs.choices = choices("地形効果を無視した")
        else if (dice <= 1) attrs.choices = [this.gainFriend("大妖精")]
        else if (dice === 2) attrs.choices = [this.gainGoods("")]
        else if (dice === 3) attrs.choices = this.happenEvent(attrs.attrs)
        else if (dice === 4) attrs.choices = this.happenAccident(attrs.attrs)
        else if (dice === 5) attrs.with("幻覚", "妖精").choices = [this.skipTurn("妖精に悪戯された")]
        else if (dice === 6) attrs.choices = [this.battleWithNPC("NPC妖精")]
      }),
    }, {
      name: "紅魔館入口",
      nextTo: ["霧の湖"],
      powerUp: { mentalUp: ["美鈴"] },
      whenEnter: wrap1D("霧の湖", function (this: EventWrapper, dice: number, attrs: WithAttribute) {
        if (dice >= 5 && this.nameIsIn(charaCategories["紅魔館の住人"]))
          attrs.choices = choices("地形効果を無視した")
        else if (dice <= 1) attrs.choices = [this.arbitrarilyWatch("門番と噂話をする。")]
        else if (dice <= 4) attrs.choices = choices("門番は微動だにしない。近づいて見てみたら、門番は立ったまま寝ていた。")
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
      whenEnter: wrap1D("紅魔館", function (this: EventWrapper, dice: number, attrs: WithAttribute) {
        if (this.nameIsIn(["パチュリー"])) dice = 1
        else if (this.nameIsIn(charaCategories["紅魔館の住人"])) dice = Math.max(1, dice - 2)
        if (dice <= 1) attrs.choices = [this.gainFriend("小悪魔")]
        else if (dice === 2) attrs.choices = [this.gainGoods("")]
        else if (dice <= 4) attrs.choices = choices("何も起きなかった")
        // TODO: 「手番はここで終了」と「次の手番は休み」は違う / それはそれとして2D
        else if (dice === 5) attrs.choices = choices("手番は終了し、2D>精神力で次の手番は休み。")
        else if (dice === 6) attrs.with("残機減少").choices = choices("「きゅっとしてドカーン」された。残機が1減る。", () => this.game.damaged(this.player))
      }),
    }, {
      name: "無何有の郷",
      nextTo: ["月夜の森", "マヨヒガの森", "人間の里", "温泉"],
      powerUp: { addOneCard: ["レティ"] },
      attributeHooks: [invalidate("無何有の郷", ["能力低下"], p => ["レティ", "チルノ"].includes(p.characterName))],
      whenEnter: wrap1D("無何有の郷", function (this: EventWrapper, dice: number, attrs: WithAttribute) {
        if (dice >= 5 && this.nameIsIn(["レティ", "チルノ"])) attrs.choices = choices("地形効果を無視した")
        else if (dice <= 1) attrs.choices = [this.gainFriend("三月精")]
        else if (dice === 2) attrs.choices = [this.gainBomb("")]
        else if (dice === 3) attrs.choices = [this.gainGoods("")]
        else if (dice === 4) attrs.choices = this.happenEvent(attrs.attrs)
        else if (dice === 5) attrs.choices = this.happenAccident(attrs.attrs)
        else if (dice === 6) attrs.choices = this.happenTrap(attrs.attrs)
      })
    }, { // TODO:
      name: "マヨヒガの森",
      nextTo: ["無何有の郷", "山の麓"],
    }, {
      name: "白玉楼",
      nextTo: ["冥界"],
      powerUp: { addOneCard: ["幽々子", "妖夢"] },
      whenEnter: wrap2D("白玉楼", function (this: EventWrapper, dice: TwoDice, attrs: WithAttribute) {
        let d = dice.a + dice.b
        let player = this.player
        if (player.life === 1 && d <= player.mental) attrs.choices = [this.gainLife("")]
        else if (player.life === 2 && d <= player.level) attrs.choices = [this.gainLife("")]
        else if (player.life <= 2 && player.items.some(x => x.name === "銘酒")) attrs.choices = [this.gainLife("銘酒を持っていた！")]
        else attrs.choices = choices("何も起きなかった")
      })
    }, {
      name: "川の畔の草原",
      nextTo: ["夜雀の屋台", "人間の里"],
      powerUp: { levelUp: ["リグル"] },
      whenEnter: wrap1D("川の畔の草原", function (this: EventWrapper, dice: number, attrs: WithAttribute) {
        if ((dice >= 4 && this.nameIsIn(["リグル"])) ||
          dice >= 5 && this.player.race === "幽霊")
          attrs.choices = choices("ダイスの出目を無視した！")
        else if (dice <= 1) attrs.choices = [this.gainBomb("")]
        else if (dice === 2) attrs.choices = [this.gainGoods("")]
        else if (dice === 3) attrs.choices = this.happenEvent(attrs.attrs)
        else if (dice === 4) attrs.choices = this.happenAccident(attrs.attrs)
        else if (dice === 5) attrs.choices = [this.skipTurn("蚤に咬まれてしまった")]
        else if (dice === 6) attrs.choices = this.damagedOn2D("恙虫(ツツガムシ)に咬まれてしまった。")
      })
    }, {
      name: "夜雀の屋台",
      nextTo: ["川の畔の草原", "人間の里"],
      powerUp: { levelUp: ["ミスティア"] },
      whenEnter: wrap1D("夜雀の屋台", function (this: EventWrapper, dice: number, attrs: WithAttribute) {
        if (dice <= 1) attrs.choices = [this.gainLife("美味しい！")]
        else if (dice === 2) attrs.choices = [this.gainBomb("")]
        else if (dice === 3) attrs.choices = [this.arbitrarilyWatch("店主と噂話をする。")]
        else if (dice === 4) attrs.choices = choices("何も起きなかった...")
        else if (dice === 5) attrs.with("飲み過ぎ").choices = [this.randomDropItem("飲み過ぎてしまった。")]
        else if (dice === 6) attrs.with("食あたり").choices = this.damagedOn2D("食あたりを起こした。")
      })
    }, {
      name: "人間の里",
      nextTo: ["無何有の郷", "川の畔の草原", "夜雀の屋台", "迷いの竹林", "春の湊", "命蓮寺", "稗田家", "香霖堂"],
      powerUp: { addOneCard: ["慧音"] },
      whenEnter: wrap1D("人間の里", function (this: EventWrapper, dice: number, attrs: WithAttribute) {
        if (this.nameIsIn(["慧音"])) dice = 1
        if (dice <= 1) attrs.choices = [this.gainFriend("稗田阿求")]
        else if (dice === 2) attrs.choices = [this.gainGoods("")]
        else if (dice === 3) attrs.choices = this.happenEvent(attrs.attrs)
        else if (dice === 4) attrs.choices = this.happenAccident(attrs.attrs)
        else if (dice === 5) attrs.with("飲み過ぎ").choices = [this.randomDropItem("飲み過ぎてしまった。")]
        else if (dice === 6) attrs.with("食あたり").choices = this.damagedOn2D("食あたりを起こした。")
      })
    }, {
      name: "迷いの竹林",
      nextTo: ["魔法の森", "人間の里", "永遠亭"],
      ignores: ["てゐ", "妹紅", "慧音"],
      powerUp: { addOneCard: ["妹紅", "てゐ"] },
      attributeHooks: [invalidate("迷いの竹林", ["迷い"], p => ["輝夜", "永琳", "優曇華院"].includes(p.characterName))],
      whenEnter: wrap1D("迷いの竹林", function (this: EventWrapper, dice: number, attrs: WithAttribute) {
        if (dice > this.player.level) attrs.choices = this.happenTrap(attrs.attrs)
        else if (dice <= 1) attrs.choices = [this.gainGoods("出目が1だと品物入手")]
      })
      // TODO: 出る時に1D
    }, {
      name: "永遠亭",
      nextTo: ["迷いの竹林"],
      ignores: ["てゐ", "妹紅", "慧音", "輝夜", "永琳", "優曇華院"],
      powerUp: { addOneCard: ["輝夜", "永琳"], mentalUp: ["てゐ", "優曇華院"] },
      whenEnter: wrap1D("永遠亭", function (this: EventWrapper, dice: number, attrs: WithAttribute) {
        if (dice <= 1) attrs.choices = [this.swapRandomCharacter("謎の薬を飲む")]
        else if (dice === 2) attrs.choices = [this.gainLife("謎の薬を飲む")]
        else if (dice === 3) attrs.choices = this.judge("工房", 1)
        else if (dice === 4) attrs.choices = [this.gainGoods("")]
        else if (dice === 5) attrs.choices = this.happenTrap(attrs.attrs)
        else if (dice === 6) attrs.with("残機減少").choices = choices("実験台にされた", () => this.game.damaged(this.player))
      })
    }, { // TODO:
      name: "無名の丘",
      nextTo: ["太陽の畑", "山の麓"],
    }, {
      name: "太陽の畑",
      nextTo: ["無名の丘", "山の麓"],
      ignores: ["幽香", "メディスン"],
      powerUp: { addOneCard: ["幽香", "ミスティア"], mentalUp: ["プリズムリバー", "衣玖"] },
      whenEnter: wrap1D("太陽の畑", function (this: EventWrapper, dice: number, attrs: WithAttribute) {
        if (dice >= 5 && this.nameIsIn(["プリズムリバー", "ミスティア", "衣玖"])) attrs.choices = choices("地形効果を無視した")
        else if (dice <= 1) attrs.choices = [this.gainBomb("")]
        else if (dice === 2) attrs.choices = [this.gainLife("")]
        else if (dice === 3) attrs.choices = choices("何も起きなかった")
        else if (dice === 4) attrs.choices = [this.skipTurn("ライブ鑑賞", false)]
        else if (dice === 5) attrs.choices = this.happenAccident(attrs.attrs)
        // WARN: ここの妖怪ってなに？？？
        else if (dice === 6) attrs.with("残機減少").choices = choices("妖怪に襲われた", () => this.game.damaged(this.player))
      })
    }, { // TODO:
      name: "三途の河",
      nextTo: ["彼岸", "冥界"],
    }, {
      name: "彼岸",
      nextTo: ["三途の河", "冥界"],
      powerUp: { addOneCard: ["四季映姫", "小町"] },
      ignores: ["四季映姫", "小町"],
      whenEnter: wrap1D("彼岸", function (this: EventWrapper, dice: number, attrs: WithAttribute) {
        if (dice >= 5 && this.player.race === "幽霊") dice -= 2
        if (dice <= 1) attrs.choices = [this.swapRandomCharacter("転生する")]
        else if (dice === 2) attrs.choices = [this.arbitrarilyWatch("死者達と噂話をする。")]
        else if (dice === 3) attrs.choices = choices("何も起きなかった")
        else if (dice === 4) attrs.choices = choices("何も起きなかった")
        else if (dice === 5) attrs.choices = [this.randomDropItem("彼岸に来る時にアイテムを落とした。")]
        // WARN: 小町の敗北条件？
        else if (dice === 6) attrs.choices = [this.skipTurn("閻魔にお説教された。")];
      })
    }, {
      name: "山の麓",
      nextTo: ["月夜の森", "霧の湖", "マヨヒガの森", "無名の丘", "太陽の畑", "妖怪の山", "工房"],
      powerUp: { mentalUp: ["秋姉妹", "雛", "にとり"] },
      whenEnter: wrap1D("山の麓", function (this: EventWrapper, dice: number, attrs: WithAttribute) {
        if (dice >= 5 && this.nameIsIn(["にとり"])) dice -= 2
        if (dice >= 5 && this.nameIsIn(["秋姉妹", "雛"]))
          attrs.choices = choices("地形効果を無視した！ ")
        if (dice >= 6 && this.nameIsIn(["文", "はたて", "早苗", "神奈子", "諏訪子"]))
          attrs.choices = choices("地形効果を無視した！ ")
        else if (dice <= 1) attrs.choices = [this.gainFriend("犬走椛")]
        else if (dice === 2) attrs.choices = [this.gainLife("神様と会う。")]
        else if (dice === 3) attrs.choices = [this.arbitrarilyWatch("河童と噂話をする。")]
        else if (dice === 4) attrs.choices = this.happenEvent(attrs.attrs)
        else if (dice === 5) attrs.choices = this.happenAccident(attrs.attrs)
        else if (dice === 6) attrs.choices = this.happenTrap(attrs.attrs)
      })
    }, { // TODO:
      name: "妖怪の山",
      nextTo: ["山の麓", "守矢神社"],
    }, {
      name: "守矢神社",
      nextTo: ["妖怪の山"],
      ignores: ["早苗", "神奈子", "諏訪子"],
      powerUp: { addOneCard: ["早苗", "神奈子", "諏訪子"] },
      whenEnter: wrap1D("守矢神社", function (this: EventWrapper, dice: number, attrs: WithAttribute) {
        if (dice <= 1) attrs.choices = [this.gainLife("神様と会う。")]
        else if (dice === 2) attrs.choices = [this.gainGoods("")]
        else if (dice === 3) attrs.choices = this.happenEvent(attrs.attrs)
        else if (dice === 4) attrs.choices = this.happenAccident(attrs.attrs)
        else if (dice === 5) attrs.with("飲み過ぎ").choices = [this.randomDropItem("飲み過ぎてしまった。")]
        // WARN: ここの妖怪ってなに？？？
        else if (dice === 6) attrs.with("残機減少").choices = choices("しこたま呑んではしゃいでいる妖怪に殴られた", () => this.game.damaged(this.player))
      })
    }, {
      name: "天界",
      nextTo: ["冥界"],
      ignores: ["天子", "衣玖", "四季映姫"],
      powerUp: { addOneCard: ["天子", "衣玖"] },
      whenEnter: wrap1D("天界", function (this: EventWrapper, dice: number, attrs: WithAttribute) {
        if (dice <= 1) attrs.choices = [this.gainLife("仙人と会う。")]
        else if (dice === 2) attrs.choices = [this.gainBomb("")]
        else if (dice === 3) attrs.choices = [this.arbitrarilyWatch("天人に水晶玉を見せてもらった。")]
        else if (dice === 4) attrs.choices = [this.gainGoods("釣りをしてみたら、魚以外のものが釣れた。")]
        else if (dice === 5) attrs.choices = [this.skipTurn("眠くなってきた。")]
        else if (dice === 6) attrs.with("飲み過ぎ").choices = [this.dropAllItems("つい飲み過ぎて爆睡してしまう")]
      })
    }, {
      // TODO: ここでは戦闘を仕掛けられない
      // TODO: アイテムの呪いを解く
      name: "温泉",
      nextTo: ["博麗神社", "無何有の郷", "地上と地底を繋ぐ橋"],
      whenEnter: wrap2D("温泉", function (this: EventWrapper, dice: TwoDice, attrs: WithAttribute) {
        let d = dice.a + dice.b
        let player = this.player
        if (player.life === 1 && d <= player.mental) attrs.choices = [this.gainLife("")]
        else if (player.life === 2 && d <= player.level) attrs.choices = [this.gainLife("")]
        else if (player.life <= 2 && player.items.some(x => x.name === "銘酒")) attrs.choices = [this.gainLife("銘酒を持っていた！")]
        else attrs.choices = choices("何も起きなかった")
      })
    }, { // TODO:NPCC 戦闘
      name: "地上と地底を繋ぐ橋",
      nextTo: ["地底の旧都", "温泉"],
    }, {
      name: "地底の旧都",
      nextTo: ["地上と地底を繋ぐ橋", "地霊殿"],
      powerUp: { addOneCard: ["ヤマメ", "勇儀"] },
      whenEnter: wrap1D("地底の旧都", function (this: EventWrapper, dice: number, attrs: WithAttribute) {
        if (dice >= 4 && this.nameIsIn(["ヤマメ", "勇儀", "パルスィ", "萃香", ...charaCategories["地霊殿の住人"]]))
          attrs.choices = choices("地形効果を無視した！ ")
        else if (dice <= 1) attrs.choices = [this.gainBomb("")]
        else if (dice === 2) attrs.choices = [this.gainGoods("")]
        else if (dice === 3) attrs.choices = [this.arbitrarilyWatch("地底の妖怪から噂話を聞く。")]
        else if (dice === 4) attrs.with("飲み過ぎ").choices = [this.randomDropItem("飲み過ぎて前後不覚になる。")]
        else if (dice === 5) attrs.with("食あたり").choices = [this.skipTurn("食あたりを起こした。")]
        else if (dice === 6) attrs.with("残機減少").choices = choices("鬼に殴られた。残機が1減る。", () => this.game.damaged(this.player))
      })
    }, { // TODO:
      name: "地霊殿",
      nextTo: ["地底の旧都"],
    }, { // TODO:
      name: "灼熱地獄",
      nextTo: [],
    }, { // TODO:
      name: "春の湊",
      nextTo: ["人間の里", "命蓮寺"],
    }, {
      name: "命蓮寺",
      nextTo: ["人間の里", "墓地", "大祀廟"],
      powerUp: { addOneCard: ["ナズーリン", "小傘", "一輪", "村紗", "星", "白蓮", "ぬえ", "マミゾウ", "響子"] },
      whenEnter: wrap1D("命蓮寺", function (this: EventWrapper, dice: number, attrs: WithAttribute) {
        if (dice >= 5 && this.nameIsIn(["ナズーリン", "小傘", "一輪", "村紗", "星", "白蓮", "ぬえ", "マミゾウ", "響子"]))
          attrs.choices = choices("地形効果を無視した！ ")
        else if (dice <= 1) attrs.choices = [this.gainBomb("")]
        else if (dice === 2) attrs.choices = [this.arbitrarilyWatch("地底の妖怪から噂話を聞く。")]
        else if (dice <= 4) attrs.choices = [this.gainGoods("")]
        else if (dice <= 6) attrs.choices = this.happenAccident(attrs.attrs)
      })
    }, {
      name: "墓地",
      nextTo: ["命蓮寺", "大祀廟", "冥界"],
      ignores: ["芳香", "青娥", "布都", "神子", "マミゾウ"],
      powerUp: { addOneCard: ["芳香", "小傘", "響子"] },
      whenEnter: wrap1D("地底の旧都", function (this: EventWrapper, dice: number, attrs: WithAttribute) {
        if (dice <= 1) attrs.choices = [this.gainBomb("")]
        else if (dice === 2) attrs.choices = [this.gainGoods("")]
        else if (dice === 3) attrs.choices = this.happenAccident(attrs.attrs)
        // TODO:
        else if (dice === 4) attrs.with("幻覚").choices = choices("不安になってきた。次の移動でもと居た場所に引き返す。")
        else if (dice === 5) attrs.choices = [this.randomDropItem("妖怪に驚かされた。")]
        else if (dice === 6) attrs.choices = choices("僵尸(幽霊)が襲ってきた。残機が3以上であれば、残機が1減る。", () => {
          if (this.player.life >= 3) this.game.damaged(this.player)
        })
      })
    }, { // TODO:
      name: "大祀廟",
      nextTo: ["命蓮寺", "墓地"],
    }, {
      name: "稗田家",
      nextTo: ["人間の里"],
      whenEnter: wrap2D("稗田家", function (this: EventWrapper, dice: TwoDice, attrs: WithAttribute) {
        let d = dice.a + dice.b
        let player = this.player
        let cs: Choice[] = [];
        if (d >= player.level + player.mental) {
          cs = [this.swapRandomCharacter("主人公以外なら転生成功！")]
        }
        if (dice.a === dice.b) {
          cs.push(this.arbitrarilyWatch("ゾロ目だったので正体確認！"))
        }
        attrs.choices = cs;
      })
    }, {
      // TODO: 魔理沙/ 霊夢は戦闘を仕掛けられない
      name: "香霖堂",
      nextTo: ["魔法の森", "人間の里"],
    }, { // TODO:
      name: "冥界",
      nextTo: ["白玉楼", "三途の河", "彼岸", "天界", "墓地"],
    }, {
      name: "工房",
      nextTo: ["山の麓"],
    },
  ]
  console.assert(tmp.length === 36)
  return tmp.map((x, i) => {
    x.ignores = x.ignores || []
    if (x.ignores.length > 0) {
      if (x.whenEnter) {
        let original = x.whenEnter
        x.whenEnter = function (this: EventWrapper): Choice[] {
          if ((x.ignores || []).includes(this.player.characterName)) return []
          return original.bind(this)()
        }
      }
      if (x.whenExit) {
        let original = x.whenExit
        x.whenExit = function (this: EventWrapper): Choice[] {
          if ((x.ignores || []).includes(this.player.characterName)) return []
          return original.bind(this)()
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
  })
}
