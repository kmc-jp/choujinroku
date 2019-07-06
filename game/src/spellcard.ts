import { CharaName } from "./character";
import { } from "./choice";
import { Ailment, Dice1D, Dice2D, TwoDice } from "./hooktype";
import * as _ from "underscore";
import { random } from "./util";
import { Player } from "./player";
export type SpellCardColor = "R" | "B" | "Y" | "G" | "P" | "W"
export type SpellCardType = "弾幕" | "武術" | "回避" | "防御" | "反撃" | "戦闘補助" | "特殊"
export type SpellCardName =
  "ディマーケイション" | "アイシクルフォール" | "リンガリングコールド" | "飛翔韋駄天" |
  "ファイヤフライフェノメノン" | "梟の夜鳴声" | "狂いの落葉" | "釣瓶落としの怪" |
  "ナズーリンペンデュラム" | "忘れ傘の夜行列車" | "げんこつスマッシュ" | "チャージドクライ" |
  "飛花落葉" | "ファーストピラミッド" | "フラスターエスケープ" | "ポイズンブレス" |
  "オヲトシハーベスター" | "ペインフロー" | "お化けキューカンバー" | "フィルドミアズマ" |
  "グリーンアイドモンスター" | "時代親父大目玉" | "ファントムシップハーバー" |
  "グレイテストトレジャー" | "エクスペリーズカナン" | "ヒールバイデザイア" |
  "ガゴウジサイクロン" | "夢想封印" | "マスタースパーク" | "殺人ドール" |
  "魔彩光の上海人形" | "霊車コンチェルトグロッソ" | "未来永劫斬" | "赤眼催眠" |
  "彼岸ルトゥール" | "龍魚ドリル" | "旧地獄の針山" | "からかさ驚きフラッシュ" |
  "ラピッドショット" | "タオ胎動" | "賢者の石" | "仙香玉兎" | "蓬莱の玉の枝" |
  "一条戻り橋" | "火の鳥ー鳳翼天翔ー" | "戸隠山投げ" | "花鳥風月,嘯風弄月" |
  "幻想風靡" | "全人類の緋想天" | "三歩必殺" | "テリブルスーヴニール" |
  "ニュークリアフュージョン" | "正義の威光" | "大物忌正餐" | "星降る神霊廟" |
  "紅色の幻想郷" | "そして誰もいなくなるか?" | "反魂蝶" | "飛翔役小角" |
  "永夜四重結界" | "ラストジャッジメント" | "マウンテン・オブ・フェイス" |
  "ミシャグジさま" | "サブタレイニアンローズ" | "聖白蓮" | "源三位頼政の弓" |
  "ワイルドカーペット" |
  "気合避け" | "パターン避け" | "切り返し" | "チョン避け" | "嘘避け" |
  "永夜返し" | "決めボム" | "喰らいボム" |
  "この程度,痛くはないけど痒いわ!" | "また妖怪の仕業ね!" | "弾幕は火力だぜ" |
  "あなたの時間も私のもの…" | "斬れぬものなど,殆ど無い!" | "常識に囚われてはいけないのですね!" |
  "ゆっくりした結果がこれだよ!!!" | "手加減はしませんよ？" |
  "いっぱいいっぱいなんだろ?" | "続けて再挑戦する" | "ゆっくりしていってね!!!" |
  "やる,って言ったらやる時もまぁまぁあるの!" | "もう十分強くなったな免許皆伝じゃ" |
  "…って慧音が言ってた." | "うふ,うふ,うふふふふ…。" |
  "NPCの攻撃" | "なし"
type SpellCardBase = {
  id?: number;
  name: SpellCardName;
  level: number;
  star: number;
  colors: SpellCardColor[];
  attribute?: Ailment | null;
  cardTypes: SpellCardType[]; // チャージドクライとかある
  diceCheck?: Dice1D | Dice2D | null;
}
export function parseSpellCard(card: SpellCard): string {
  let star = "☆".repeat(card.star);
  if (card.cardTypes.includes("武術") || card.cardTypes.includes("弾幕")) {
    return `${card.cardTypes[0]}:${card.name}(LV:${card.level}) ${star} ${card.colors.join("")}`
  }
  return `${card.name}(LV:${card.level}) ${star}`
}
export type SpellCard = Required<SpellCardBase>
export function getAllSpellCards(): SpellCard[] {
  let kiaiyokeDice: Dice2D = { type: "2D", success: (p: Player, d: TwoDice) => d.a + d.b <= p.mental }
  let patternDice: Dice1D = { type: "1D", success: (p: Player, d: number) => d <= p.level }
  let kirikaeshiDice: Dice1D = { type: "1D", success: (p: Player, d: number) => d >= 3 }
  let chonyokeDice: Dice1D = { type: "1D", success: (p: Player, d: number) => d <= 4 }
  // WARN: 必ず回避とか知らんが
  let usoyokeDice: Dice1D = { type: "1D", success: (p: Player, d: number) => p.life === 1 || d % 2 === 1 }

  let tmp: SpellCardBase[] = [
    { name: "ディマーケイション", level: 2, star: 1, colors: ["B", "G"], cardTypes: ["弾幕"] },
    { name: "アイシクルフォール", level: 2, star: 2, colors: ["B", "Y"], cardTypes: ["弾幕"] },
    { name: "リンガリングコールド", level: 2, star: 1, colors: ["B", "W"], cardTypes: ["弾幕"] },
    { name: "飛翔韋駄天", level: 2, star: 2, colors: ["R", "Y"], cardTypes: ["武術"] },
    { name: "ファイヤフライフェノメノン", level: 2, star: 1, colors: ["B", "G"], cardTypes: ["弾幕"] },
    { name: "梟の夜鳴声", level: 2, star: 2, colors: ["R", "G"], cardTypes: ["弾幕"] },
    { name: "狂いの落葉", level: 2, star: 1, colors: ["R", "Y"], cardTypes: ["弾幕"] },
    { name: "釣瓶落としの怪", level: 2, star: 2, colors: ["P", "G"], cardTypes: ["弾幕"] },
    { name: "ナズーリンペンデュラム", level: 2, star: 1, colors: ["R", "B"], cardTypes: ["弾幕"] },
    { name: "忘れ傘の夜行列車", level: 2, star: 2, colors: ["P", "R", "B"], cardTypes: ["弾幕"] },
    { name: "げんこつスマッシュ", level: 2, star: 1, colors: ["P", "W"], cardTypes: ["武術"] },
    { name: "チャージドクライ", level: 2, star: 2, colors: ["R", "B"], cardTypes: ["弾幕"] },
    { name: "飛花落葉", level: 3, star: 1, colors: ["P", "R", "B", "G", "Y"], cardTypes: ["武術"] },
    { name: "ファーストピラミッド", level: 3, star: 2, colors: ["B", "W"], cardTypes: ["弾幕"] },
    { name: "フラスターエスケープ", level: 3, star: 1, colors: ["R", "W"], cardTypes: ["弾幕"] },
    { name: "ポイズンブレス", level: 3, star: 2, colors: ["P", "G", "Y"], cardTypes: ["弾幕"] },
    { name: "オヲトシハーベスター", level: 3, star: 1, colors: ["R", "Y"], cardTypes: ["弾幕"] },
    { name: "ペインフロー", level: 3, star: 2, colors: ["P", "R"], cardTypes: ["弾幕"] },
    { name: "お化けキューカンバー", level: 3, star: 1, colors: ["B", "G"], cardTypes: ["弾幕"] },
    { name: "フィルドミアズマ", level: 3, star: 2, colors: ["P", "R"], cardTypes: ["弾幕"] },
    { name: "グリーンアイドモンスター", level: 3, star: 1, colors: ["G", "W"], cardTypes: ["弾幕"] },
    { name: "時代親父大目玉", level: 3, star: 2, colors: ["P", "W"], cardTypes: ["弾幕"] },
    { name: "ファントムシップハーバー", level: 3, star: 1, colors: ["P", "B"], cardTypes: ["弾幕"] },
    { name: "グレイテストトレジャー", level: 3, star: 2, colors: ["R", "B", "W"], cardTypes: ["弾幕"] },
    { name: "エクスペリーズカナン", level: 3, star: 1, colors: ["R", "Y", "W"], cardTypes: ["武術"] },
    { name: "ヒールバイデザイア", level: 3, star: 2, colors: ["R", "B", "W"], cardTypes: ["弾幕"] },
    { name: "ガゴウジサイクロン", level: 3, star: 1, colors: ["Y", "W"], cardTypes: ["弾幕"] },
    { name: "夢想封印", level: 4, star: 2, colors: ["R", "W"], cardTypes: ["弾幕"] },
    { name: "マスタースパーク", level: 4, star: 1, colors: ["P", "R", "B", "G", "Y", "W"], cardTypes: ["弾幕"] },
    { name: "殺人ドール", level: 4, star: 2, colors: ["R", "B", "G", "W"], cardTypes: ["武術"] },
    { name: "魔彩光の上海人形", level: 4, star: 1, colors: ["R", "B", "Y"], cardTypes: ["弾幕"] },
    { name: "霊車コンチェルトグロッソ", level: 4, star: 2, colors: ["R", "B", "G", "Y"], cardTypes: ["弾幕"] },
    { name: "未来永劫斬", level: 4, star: 1, colors: ["P", "B", "W"], cardTypes: ["武術"] },
    { name: "赤眼催眠", level: 4, star: 2, colors: ["P", "R"], cardTypes: ["弾幕"] },
    { name: "彼岸ルトゥール", level: 4, star: 1, colors: ["R", "Y", "W"], cardTypes: ["弾幕"] },
    { name: "龍魚ドリル", level: 4, star: 1, colors: ["B", "W"], cardTypes: ["武術"] },
    { name: "旧地獄の針山", level: 4, star: 2, colors: ["P", "W"], cardTypes: ["弾幕"] },
    { name: "からかさ驚きフラッシュ", level: 4, star: 1, colors: ["P", "B"], cardTypes: ["弾幕"] },
    { name: "ラピッドショット", level: 4, star: 2, colors: ["B", "Y", "W"], cardTypes: ["弾幕"] },
    { name: "タオ胎動", level: 4, star: 1, colors: ["B", "G", "W"], cardTypes: ["弾幕"] },
    { name: "賢者の石", level: 5, star: 2, colors: ["R", "B", "G", "Y", "W"], cardTypes: ["弾幕"] },
    { name: "仙香玉兎", level: 5, star: 1, colors: ["B", "G", "W"], cardTypes: ["弾幕"] },
    { name: "蓬莱の玉の枝", level: 5, star: 2, colors: ["P", "R", "B", "G", "Y"], cardTypes: ["弾幕"] },
    { name: "一条戻り橋", level: 5, star: 1, colors: ["P", "B", "Y"], cardTypes: ["弾幕"] },
    { name: "火の鳥ー鳳翼天翔ー", level: 5, star: 2, colors: ["R", "W"], cardTypes: ["弾幕"] },
    { name: "戸隠山投げ", level: 5, star: 1, colors: ["P", "B", "W"], cardTypes: ["武術"] },
    { name: "花鳥風月,嘯風弄月", level: 5, star: 2, colors: ["R", "Y"], cardTypes: ["弾幕"] },
    { name: "幻想風靡", level: 5, star: 1, colors: ["P", "G", "W"], cardTypes: ["武術"] },
    { name: "全人類の緋想天", level: 5, star: 2, colors: ["P", "R", "W"], cardTypes: ["弾幕"] },
    { name: "三歩必殺", level: 5, star: 1, colors: ["P", "R", "B", "G", "W"], cardTypes: ["弾幕"] },
    { name: "テリブルスーヴニール", level: 5, star: 2, colors: ["P", "R", "Y"], cardTypes: ["弾幕"] },
    { name: "ニュークリアフュージョン", level: 5, star: 1, colors: ["R", "B", "W"], cardTypes: ["弾幕"] },
    { name: "正義の威光", level: 5, star: 2, colors: ["B", "Y"], cardTypes: ["弾幕"] },
    { name: "大物忌正餐", level: 5, star: 1, colors: ["R", "B", "Y"], cardTypes: ["弾幕"] },
    { name: "星降る神霊廟", level: 5, star: 2, colors: ["P", "R", "G", "W"], cardTypes: ["弾幕"] },
    { name: "紅色の幻想郷", level: 6, star: 1, colors: ["P", "R", "W"], cardTypes: ["弾幕"] },
    { name: "そして誰もいなくなるか?", level: 6, star: 2, colors: ["R", "B", "G", "Y"], cardTypes: ["弾幕"] },
    { name: "反魂蝶", level: 6, star: 1, colors: ["P", "R", "B", "W"], cardTypes: ["弾幕"] },
    { name: "飛翔役小角", level: 6, star: 2, colors: ["B", "G", "Y"], cardTypes: ["武術"] },
    { name: "永夜四重結界", level: 6, star: 1, colors: ["P", "B"], cardTypes: ["弾幕"] },
    { name: "ラストジャッジメント", level: 6, star: 2, colors: ["P", "R", "B", "Y", "W"], cardTypes: ["弾幕"] },
    { name: "マウンテン・オブ・フェイス", level: 6, star: 1, colors: ["P", "R", "B", "G"], cardTypes: ["弾幕"] },
    { name: "ミシャグジさま", level: 6, star: 2, colors: ["G", "W"], cardTypes: ["弾幕"] },
    { name: "サブタレイニアンローズ", level: 6, star: 1, colors: ["R", "B", "Y"], cardTypes: ["弾幕"] },
    { name: "聖白蓮", level: 6, star: 2, colors: ["P", "B", "W"], cardTypes: ["武術"] },
    { name: "源三位頼政の弓", level: 6, star: 1, colors: ["P", "W"], cardTypes: ["弾幕"] },
    { name: "気合避け", level: 0, star: 1, colors: [], cardTypes: ["回避"], diceCheck: kiaiyokeDice },
    { name: "気合避け", level: 0, star: 2, colors: [], cardTypes: ["回避"], diceCheck: kiaiyokeDice },
    { name: "気合避け", level: 0, star: 3, colors: [], cardTypes: ["回避"], diceCheck: kiaiyokeDice },
    { name: "気合避け", level: 0, star: 4, colors: [], cardTypes: ["回避"], diceCheck: kiaiyokeDice },
    { name: "パターン避け", level: 0, star: 1, colors: [], cardTypes: ["回避"], diceCheck: patternDice },
    { name: "パターン避け", level: 0, star: 2, colors: [], cardTypes: ["回避"], diceCheck: patternDice },
    { name: "パターン避け", level: 0, star: 3, colors: [], cardTypes: ["回避"], diceCheck: patternDice },
    { name: "パターン避け", level: 0, star: 4, colors: [], cardTypes: ["回避"], diceCheck: patternDice },
    { name: "切り返し", level: 0, star: 1, colors: [], cardTypes: ["回避"], diceCheck: kirikaeshiDice },
    { name: "切り返し", level: 0, star: 2, colors: [], cardTypes: ["回避"], diceCheck: kirikaeshiDice },
    { name: "切り返し", level: 0, star: 3, colors: [], cardTypes: ["回避"], diceCheck: kirikaeshiDice },
    { name: "切り返し", level: 0, star: 4, colors: [], cardTypes: ["回避"], diceCheck: kirikaeshiDice },
    { name: "チョン避け", level: 0, star: 1, colors: [], cardTypes: ["回避"], diceCheck: chonyokeDice },
    { name: "チョン避け", level: 0, star: 2, colors: [], cardTypes: ["回避"], diceCheck: chonyokeDice },
    { name: "チョン避け", level: 0, star: 3, colors: [], cardTypes: ["回避"], diceCheck: chonyokeDice },
    { name: "チョン避け", level: 0, star: 4, colors: [], cardTypes: ["回避"], diceCheck: chonyokeDice },
    { name: "嘘避け", level: 0, star: 5, colors: [], cardTypes: ["回避"], diceCheck: usoyokeDice },
    { name: "永夜返し", level: 0, star: 2, colors: [], cardTypes: ["反撃"] },
    { name: "永夜返し", level: 0, star: 3, colors: [], cardTypes: ["反撃"] },
    { name: "永夜返し", level: 0, star: 4, colors: [], cardTypes: ["反撃"] },
    { name: "永夜返し", level: 0, star: 5, colors: [], cardTypes: ["反撃"] },
    { name: "決めボム", level: 0, star: 3, colors: [], cardTypes: ["反撃"] },
    { name: "決めボム", level: 0, star: 4, colors: [], cardTypes: ["反撃"] },
    { name: "喰らいボム", level: 0, star: 2, colors: [], cardTypes: ["防御"] },
    { name: "喰らいボム", level: 0, star: 3, colors: [], cardTypes: ["防御"] },
    { name: "この程度,痛くはないけど痒いわ!", level: 0, star: 5, colors: [], cardTypes: ["防御"] },
    { name: "また妖怪の仕業ね!", level: 0, star: 3, colors: [], cardTypes: ["戦闘補助"] },
    { name: "弾幕は火力だぜ", level: 0, star: 3, colors: [], cardTypes: ["戦闘補助"] },
    { name: "あなたの時間も私のもの…", level: 0, star: 3, colors: [], cardTypes: ["戦闘補助"] },
    { name: "斬れぬものなど,殆ど無い!", level: 0, star: 3, colors: [], cardTypes: ["戦闘補助"] },
    { name: "常識に囚われてはいけないのですね!", level: 0, star: 3, colors: [], cardTypes: ["戦闘補助"] },
    { name: "ゆっくりした結果がこれだよ!!!", level: 0, star: 6, colors: [], cardTypes: ["戦闘補助"] },
    { name: "手加減はしませんよ？", level: 0, star: 3, colors: [], cardTypes: ["戦闘補助"] },
    { name: "いっぱいいっぱいなんだろ?", level: 0, star: 5, colors: [], cardTypes: ["特殊"] },
    { name: "続けて再挑戦する", level: 0, star: 4, colors: [], cardTypes: ["特殊"] },
    { name: "ゆっくりしていってね!!!", level: 0, star: 4, colors: [], cardTypes: ["特殊"] },
    { name: "やる,って言ったらやる時もまぁまぁあるの!", level: 0, star: 6, colors: [], cardTypes: ["特殊"] },
    { name: "もう十分強くなったな免許皆伝じゃ", level: 0, star: 4, colors: [], cardTypes: ["特殊"] },
    { name: "…って慧音が言ってた.", level: 0, star: 6, colors: [], cardTypes: ["特殊"] },
    { name: "うふ,うふ,うふふふふ…。", level: 0, star: 5, colors: [], cardTypes: ["特殊"] },
  ]
  return tmp.map((x, i) => ({
    ...x,
    id: i,
    diceCheck: null,
    attribute: x.attribute || null,
  }));
}
