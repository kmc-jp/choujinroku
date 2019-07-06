import { Choice, choices } from "./choice";
import { AttributeHook, Attribute, SpecificActionHook, VictoryHook, NPCType, Hooks } from "./hooktype"
import { drawACard } from "./specificaction"
import * as Victory from "./victory";
import { invalidate, invalidate1D, invalidate2D } from "./attributehook";
import { Game } from "./game";
import { Player } from "./player";
import { FieldAction } from "./fieldaction";
import { SpellCardName, SpellCard } from "./spellcard";
import { Item, FairyFriendNames } from "./item";
import { Land } from "./land";
import { Pos } from "./pos";

export type CharaName = "華扇" | "霊夢" | "魔理沙" | "ルーミア" | "チルノ" | "美鈴" | "パチュリー" | "咲夜" | "レミリア" | "フラン" | "レティ" | "橙" | "アリス" | "プリズムリバー" | "妖夢" | "幽々子" | "藍" | "紫" | "萃香" | "リグル" | "ミスティア" | "慧音" | "てゐ" | "優曇華院" | "永琳" | "輝夜" | "妹紅" | "メディスン" | "幽香" | "文" | "小町" | "四季映姫" | "秋姉妹" | "雛" | "にとり" | "早苗" | "神奈子" | "諏訪子" | "衣玖" | "天子" | "ヤマメ" | "パルスィ" | "勇儀" | "さとり" | "燐" | "空" | "こいし" | "ナズーリン" | "小傘" | "一輪" | "村紗" | "星" | "白蓮" | "ぬえ" | "はたて" | "響子" | "芳香" | "青娥" | "布都" | "神子" | "マミゾウ"
export const charaCategories = {
  "バカルテット": ((): CharaName[] => ["チルノ", "ルーミア", "リグル", "ミスティア"])(),
  "紅魔館の住人": ((): CharaName[] => ["美鈴", "パチュリー", "咲夜", "レミリア", "フラン"])(),
  "地霊殿の住人": ((): CharaName[] => ["さとり", "燐", "空", "こいし"])()
};

export type RaceName = "人間" | "妖怪" | "妖精" | "魔法使い" | "吸血鬼" | "幽霊" | "仙人" | "聖人" | "種族不明" | "半人半霊"

export type RoleName = "主人公" | "妖怪" | "野次馬"
// ボムが必要な場合は関数内で処理すること
type CharacterBase = Hooks & {
  name: CharaName;
  fullname: string;
  level: number; // レベル
  mental: number; // 精神力
  spellCard: SpellCardName;
  role: RoleName;
  race?: RaceName;
  whenWin?: VictoryHook[];
  whenLose?: VictoryHook[];
  id?: number;
  // アイテム所持数の数え方が特殊なキャラ用
  howToCountItems?: ((player: Player) => number) | null;
  // アイテムを捨てられないキャラ用
  canDiscardItem?: ((player: Player, item: Item) => boolean) | null
}
export type Character = Required<CharacterBase>;


export function getAllCharacters(): Character[] {
  // 書き方サンプル
  let 大食い: AttributeHook = {
    overwrite: true,
    when: ["毒茸", "食あたり", "飲み過ぎ"],
    choices(player: Player) {
      return player.game.getTwoDiceChoices(player, "大食い", dice => {
        let success = dice.a + dice.b <= player.level
        if (!success) return choices("大食いをした！ ")
        player.heal();
        return choices("大食いをして残機が1増えた！ ")
      })
    }
  };
  // 敗北条件は知らん！
  let tmp: CharacterBase[] = [{
    name: "霊夢",
    fullname: "博麗 霊夢",
    spellCard: "夢想封印",
    role: "主人公",
    level: 4,
    mental: 7,
    race: "人間",
    // まだ: G常ダイス反転 / B戦(夢想天生)
    attributeHooks: [
      invalidate("楽園の素敵な巫女", ["能力低下"], p => p.items.some(x => x.name === "銘酒")),
      invalidate1D("空を飛ぶ程度の能力",
        [["残機減少", "地形破壊"], ["残機減少", "落とし穴"], ["残機減少", "大ナマズ"]],
        (p, d) => d <= p.level),
      invalidate2D("楽園の素敵な巫女", ["満身創痍"], (p, d) => d.a + d.b <= p.mental)
    ],
    specificActions: [
      drawACard("楽園の素敵な巫女", (a, b, c) =>
        b instanceof Player && // 相手がPCで
        a.watched.has(b.id) && // 正体を確認していて
        b.role === "妖怪" &&  // 妖怪で
        c.cardTypes.includes("弾幕")), // 弾幕の時
    ],
    whenWin: [
      ...Victory.allWatchAndAllWinToWin(p => p.role === "妖怪" && p.characterName !== "紫"),
      Victory.waitToWin("博麗神社", ["神社の御札"], 3),
      Victory.gatherToWin("博麗神社", "銘酒", 3)
    ], whenLose: [
      Victory.loseToLose((me, a) => me.watched.has(a.id) && a.level <= 3 && a.role === "妖怪"),
      Victory.damagedToLose(me => me.items.some(x => x.name === "神社の御札"))
    ]
  }, {
    name: "魔理沙",
    fullname: "霧雨魔理沙",
    spellCard: "マスタースパーク",
    role: "主人公",
    level: 4,
    mental: 7,
    race: "人間",
    // まだ: 戦闘 / 強奪 ...
    attributeHooks: [
      invalidate("魔法を使う程度の能力", ["毒茸"]),
      invalidate2D("努力家", ["満身創痍"], (p, d) => d.a + d.b <= p.mental)
    ],
    whenWin: [
      ...Victory.allWatchAndAllWinToWin(p => p.role === "妖怪" && p.characterName !== "にとり"),
      Victory.waitToWin("魔法の森", ["ミニ八卦炉", "ドロワーズ"], 1),
    ], whenLose: [
    ],
    howToCountItems() { return 0; }, // アイテムは無限に持てる
    canDiscardItem(player, item) { return false; } // アイテムを捨てられない
  }, {
    name: "ルーミア",
    fullname: "ルーミア",
    role: "妖怪",
    spellCard: "ディマーケイション",
    level: 2,
    mental: 7,
    race: "妖怪",
    attributeHooks: [
      invalidate2D("バカルテット", ["満身創痍"], (p, d) => d.a + d.b <= p.mental)
    ], whenWin: [
      Victory.waitToWin("月夜の森", ["リボン"], 2),
    ], whenLose: [
      Victory.destroyedToLose(["月夜の森"]),
    ]
  }, {
    name: "チルノ",
    fullname: "チルノ",
    role: "野次馬",
    spellCard: "アイシクルフォール",
    level: 1,
    mental: 9,
    race: "妖精",
    attributeHooks: [
      invalidate("さいきょーの妖精", [["残機減少", "地形破壊"]]),
      invalidate("さいきょーの妖精", ["妖精"]),
      invalidate("さいきょーの妖精", ["呪い", "能力低下"], (_, a) => !a.includes("地形効果")),
    ],
    whenWin: [
      Victory.winToWin((me, a, c) =>
        c.level === 6 && a.friend ? FairyFriendNames.includes(a.friend.name) : false),
      ...Victory.allWatchAndAllWinToWin(p =>
        !charaCategories["バカルテット"].includes(p.characterName)),
    ], whenLose: [
      Victory.destroyedToLose(["霧の湖"]),
    ]
  }, {
    name: "美鈴",
    fullname: "紅美鈴",
    role: "妖怪",
    spellCard: "飛花落葉",
    level: 3,
    mental: 6,
    race: "妖怪",
    whenWin: [
      Victory.winToWin((me, a) => a.role === "主人公" && a.characterName !== "咲夜" &&
        (me.currentLand ? me.currentLand.landAttributes.includes("紅マス") : false)),
      Victory.waitToWin("紅魔館入口", ["武術指南書"], 1),
    ], whenLose: [
      Victory.destroyedToLose(["紅魔館", "紅魔館入口"]),
      Victory.damagedToLose(me =>
        me.game.getOthersAtSamePos(me).some(x =>
          me.watched.has(x.id) && charaCategories["紅魔館の住人"].includes(x.characterName)))
    ]
  }, {
    name: "パチュリー",
    fullname: "パチュリー・ノーレッジ",
    role: "野次馬",
    spellCard: "賢者の石",
    level: 5,
    mental: 5,
    race: "魔法使い",
    // 戦闘時、レベルは1さがると解釈
    levelChange(p: Player, level: number) {
      if (!p.isBattle) return level;
      if (p.friend && p.friend.name === "小悪魔") return level;
      if (p.items.some(item => item.name === "蓬莱の薬" || item.name === "タミフル" || item.name === "リポD")) return level;
      return level - 1;
    },
    whenWin: [
      Victory.winToWin((me, a) => a.items.some(x => x.name === "呪法書")),
    ], whenLose: [
      Victory.destroyedToLose(["図書館", "紅魔館"]),
    ]
  }, {
    name: "咲夜",
    fullname: "十六夜咲夜",
    role: "主人公",
    spellCard: "殺人ドール",
    level: 4,
    mental: 7,
    race: "人間",
    attributeHooks: [
      invalidate("時間を操る程度の能力", ["手番休み"]),
      invalidate("完璧で瀟洒なメイド", ["能力低下", "幻覚", "呪い"],
        p => p.game.getOthersAtSamePos(p).some(
          x => charaCategories["紅魔館の住人"].includes(x.characterName) && p.watched.has(x.id)))
    ],
    whenWin: [
      Victory.killToWin((me, a) => a.wonArray.some(
        x => charaCategories["紅魔館の住人"].includes(me.game.players[x].characterName))),
      Victory.waitToWin("紅魔館", ["PAD"], 2),
    ], whenLose: [
      Victory.damagedToLose(me => me.items.some(x => x.name === "PAD"))
    ]
  }, {
    name: "レミリア",
    fullname: "レミリア・スカーレット",
    role: "野次馬",
    spellCard: "紅色の幻想郷",
    level: 5,
    mental: 6,
    race: "吸血鬼",
    attributeHooks: [
      invalidate1D("紅い悪魔", ["残機減少"], (p, d) => d <= p.level),
    ], whenWin: [
      Victory.waitToWin("紅魔館", ["カリスマの秘訣"], 3),
      Victory.waitToWinWith(p => {
        let land = p.currentLand;
        if (!land) return false;
        if (!land.landAttributes.includes("紅マス")) return false;
        if (p.waitCount < 1) return false;
        for (let other of p.game.getOthers(p)) {
          if (!charaCategories["紅魔館の住人"].includes(other.characterName) && !p.won.has(other.id)) return false;
        }
        return true;
      })
    ], whenLose: [
      Victory.destroyedToLose(["紅魔館"]),
      Victory.damagedToLose(me => me.items.some(x => x.name === "カリスマの秘訣"))
    ]
  }, {
    name: "フラン",
    fullname: "フランドール・スカーレット",
    role: "野次馬",
    spellCard: "そして誰もいなくなるか?",
    level: 5,
    mental: 5,
    race: "吸血鬼",
    attributeHooks: [
      invalidate1D("悪魔の妹", ["残機減少"], (p, d) => d <= p.level),
    ], whenWin: [
      Victory.waitToWin("紅魔館", ["手作りの人形"], 2),
      Victory.killToWin((me, a) => a.role === "主人公" && a.characterName !== "咲夜"),
    ], whenLose: [
      Victory.destroyedToLose(["紅魔館"]),
      Victory.damagedToLose(me => me.currentLand ? me.currentLand.landAttributes.includes("紅マス") : false)
    ]
  }, {
    name: "レティ",
    fullname: "レティ・ホワイトロック",
    role: "妖怪",
    spellCard: "リンガリングコールド",
    level: 3,
    mental: 6,
    race: "妖怪",
    whenWin: [
      Victory.waitToWin("無何有の郷", ["ドロワーズ"], 1),
      Victory.winToWin((me, a) => (a.friend && a.friend.name === "リリーホワイト") || a.characterName === "秋姉妹"),
    ], whenLose: [
      Victory.destroyedToLose(["無何有の郷"]),
      Victory.watchedToLose((me, from) => me.game.getOthers(me).every(x => x.watched.has(me.id)))
    ]
  }, {
    name: "橙",
    fullname: "橙",
    role: "妖怪",
    spellCard: "飛翔韋駄天",
    level: 2,
    mental: 7,
    race: "妖怪",
    attributeHooks: [
      invalidate("妖怪の式の式", ["天狗警備隊"]),
    ],
    whenWin: [
      Victory.waitToWin("マヨヒガの森", ["幻想郷の歩き方"], 1),
    ], whenLose: [
      Victory.destroyedToLose(["マヨヒガの森"]),
      Victory.damagedToLose(me => me.currentLand ? me.currentLand.landAttributes.includes("水マス") : false)
    ]
  }, {
    name: "アリス",
    fullname: "アリス・マーガトロイド",
    role: "野次馬",
    spellCard: "魔彩光の上海人形",
    level: 4,
    mental: 6,
    race: "魔法使い",
    attributeHooks: [
      invalidate("人形を操る程度の能力", ["アイテム", "呪い"]),
    ],
    whenWin: [
      Victory.waitToWin("魔法の森", ["手作りの人形"], 2),
      Victory.winToWin((me, a) => a.items.some(x => x.name === "呪法書")),
    ], whenLose: [
      Victory.destroyedToLose(["魔法の森"]),
    ]
  }, {
    name: "プリズムリバー",
    fullname: "プリズムリバー三姉妹",
    role: "野次馬",
    spellCard: "霊車コンチェルトグロッソ",
    level: 4,
    mental: 5,
    race: "幽霊",
    whenWin: [
      Victory.waitToWin("太陽の畑", ["カリスマの秘訣"], 2),
      {
        type: "A",
        when: ["移動", "残機上昇"],
        hook(me: Player) {
          return me.life >= 3 && me.items.filter(i => i.name === "タミフル").length >= 3
        }
      }
    ],
    whenLose: [
      Victory.damagedToLose(me => me.currentLand ? me.currentLand.name === "太陽の畑" : false)
    ]
  }, {
    name: "妖夢",
    fullname: "魂魄妖夢",
    role: "主人公",
    spellCard: "未来永劫斬",
    level: 4,
    mental: 7,
    race: "半人半霊",
    fieldActions: [
      //〇〇は隣接扱いと成る　ここでいいの？？？
    ],
    whenWin: [
      ...Victory.haveItemAndAllWinToWin("武術指南書", (player => player.characterName != "幽々子" && player.characterName != "優曇華院")),
      Victory.waitToWin("白玉楼", ["蓬莱の薬", "船幽霊の柄杓"], 1)
    ],
    whenLose: [
      Victory.destroyedToLose(["白玉楼"])
    ]
  }, {
    name: "響子",
    fullname: "幽谷 響子",
    spellCard: "チャージドクライ",
    role: "妖怪",
    level: 3,
    mental: 6,
    race: "妖怪",
    // attributeHooksとspecificActionsは未追加
    whenWin: [
      Victory.winToWin((me, a) => me.currentLand ? me.currentLand.name === "命蓮寺" : false),
      Victory.winToWin((me, a, c) => a.race === "人間" && c.level === 6 && c.cardTypes.includes("弾幕")),
      Victory.waitToWin("命蓮寺", [], 1, p =>
        p.game.getOthers(p).every(other => p.watched.has(other.id))
      ),
    ], whenLose: [
      Victory.destroyedToLose(["命蓮寺"]),
      // TODO : 場にいるのが自分だけなら敗北
    ]
  }, {
    name: "芳香",
    fullname: "宮古 芳香",
    spellCard: "ヒールバイデザイア",
    role: "野次馬",
    level: 2,
    mental: 7,
    race: "幽霊",
    // attributeHooksとspecificActionsは未追加
    whenWin: [
      Victory.waitToWin("墓地", ["神社の御札"], 1),
      Victory.waitToWin("墓地", [], 1, p => p.life === 5),
    ], whenLose: [
      Victory.destroyedToLose(["墓地"]),
      Victory.loseToLose((me, a) => a.items.some(x => x.name === "浄玻璃の鏡" || x.name === "聖の宝塔")),
    ]
  }, {
    name: "青娥",
    fullname: "霍 青娥",
    spellCard: "タオ胎動",
    role: "野次馬",
    level: 4,
    mental: 5,
    race: "仙人",
    // attributeHooksとspecificActionsは未追加
    whenWin: [
      Victory.waitToWin("大祀廟", ["羽衣"], 2),
      // 主人公のうち1人にでも勝ったら
      Victory.waitToWin("大祀廟", [], 1, p =>
        p.game.getOthers(p).some(other => other.role === "主人公" && p.won.has(other.id))
      ),
      Victory.killToWin((me, a) => a.role === "主人公"),
    ], whenLose: [
      Victory.destroyedToLose(["大祀廟"]),
      Victory.damagedToLose(me => me.items.some(x => x.name === "羽衣")),
    ]
  }, {
    name: "布都",
    fullname: "物部 布都 & 蘇我 屠自古",
    spellCard: "大物忌正餐",  // ガコウジサイクロンもあるよ
    role: "野次馬",
    level: 5,
    mental: 5,
    race: "人間", // 幽霊でもある
    // attributeHooksとspecificActionsは未追加
    whenWin: [
      Victory.waitToWin("大祀廟", ["舟", "死神の舟"], 2),
      // 主人公のうち1人にでも勝ったら
      Victory.waitToWin("大祀廟", [], 1, p =>
        p.game.getOthers(p).some(other => other.role === "主人公" && p.won.has(other.id))
      ),
      Victory.killToWin((me, a) => a.role === "主人公"),
    ], whenLose: [
      Victory.destroyedToLose(["大祀廟"]),
      Victory.damagedToLose(me => me.items.some(x => x.name === "舟" || x.name === "死神の舟")),
    ]
  }, {
    name: "神子",
    fullname: "豊聡耳 神子",
    spellCard: "星降る神霊廟",
    role: "野次馬",
    level: 5,
    mental: 5,
    race: "聖人",
    // attributeHooksとspecificActionsは未追加
    whenWin: [
      Victory.waitToWin("大祀廟", ["宝剣"], 2),
      Victory.destroyedToWin(["命蓮寺"]),
    ], whenLose: [
      Victory.destroyedToLose(["大祀廟"]),
      Victory.damagedToLose(me => me.items.some(x => x.name === "宝剣")),
    ], attributeHooks: [
      invalidate("たわむれはおわりじゃ！", ["能力低下", "幻覚"], p => p.life === 1),
    ],
    mentalChange: (p: Player, n: number) => p.life === 1 ? n + 1 : n;
  }, {
    name: "マミゾウ",
    fullname: "二ツ岩 マミゾウ",
    spellCard: "ワイルドカーペット",
    role: "妖怪",
    level: 5,
    mental: 6,
    race: "妖怪",
    // attributeHooksとspecificActionsは未追加
    whenWin: [
      Victory.winToWin((me, a) => a.characterName === "神子"),
      Victory.winToWin((me, a) => a.role === "主人公" &&
        a.wonArray.some(x => me.game.players[x].role === "妖怪")),
      Victory.gatherToWin("命蓮寺", "銘酒", 3),
    ], whenLose: [
      Victory.destroyedToLose(["命蓮寺"]),
      Victory.damagedToLose(me => me.items.some(x => x.name === "銘酒")),
    ]
  },
  ]
  // 紫は書いていないけどスキマ送り耐性を忘れないでね！
  // 文はアクシデント6「他者が盛大に転んだマスに居合わせれば勝利、自分が盛大に転んだマスに他者が居たら敗北となる。」を忘れないで！
  let result: Character[] = [];
  tmp.forEach((x, i) => result.push({
    id: i,
    name: x.name,
    fullname: x.fullname,
    level: x.level,
    mental: x.mental,
    spellCard: x.spellCard,
    role: x.role,
    race: x.race || "種族不明",
    attributeHooks: x.attributeHooks || [],
    fieldActions: x.fieldActions || [],
    whenWin: x.whenWin || [],
    whenLose: x.whenLose || [],
    nextToPosesGenerator: x.nextToPosesGenerator || (p => []),
    levelChange: x.levelChange || (p => p.level),
    mentalChange: x.mentalChange || (p => p.mental),
    specificActions: x.specificActions || [],
    howToCountItems: x.howToCountItems || null,
    canDiscardItem: x.canDiscardItem || null
  }));
  return result;
}
