import { CharaName } from "./character";
import { } from "./choice";
import { Ailment } from "./hook";
import * as _ from "underscore";
import { random } from "./util";
export type SpellCardColor = "R" | "B" | "Y" | "G" | "P" | "W"
export type SpellCardType = "弾幕" | "武術" | "回避" | "防御" | "戦闘補助" | "特殊"
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
  "NPCの攻撃" | "なし"
type SpellCardBase = {
  id?: number;
  name: SpellCardName;
  level: number;
  star: number;
  colors: SpellCardColor[];
  attribute?: Ailment | null;
  cardTypes: SpellCardType[]; // チャージドクライとかある
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
  let defaultSpellCard: SpellCardBase = {
    name: "ディマーケイション",
    level: 2,
    star: 1,
    colors: ["B", "G"],
    attribute: "能力低下",
    cardTypes: ["弾幕"]
  };
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
    { name: "ワイルドカーペット", level: 6, star: 2, colors: ["R", "G"], cardTypes: ["弾幕"] },
  ]
  /*
  |気合避け|2D≦精神力でスペカを回避できる| |x|1|69|
|気合避け|〃|〃|〃|2|70|
|気合避け|〃|〃|〃|3|71|
|気合避け|〃|〃|〃|4|72|
|パターン避け|1D≦レベルでスペカを回避できる| |x|1|73|
|パターン避け|〃|〃|〃|2|74|
|パターン避け|〃|〃|〃|3|75|
|パターン避け|〃|〃|〃|4|76|
|切り返し|1D≧3でスペカを回避できる| |x|1|77|
|切り返し|〃|〃|〃|2|78|
|切り返し|〃|〃|〃|3|79|
|切り返し|〃|〃|〃|4|80|
|チョン避け|1D≦4でスペカを回避できる| |x|1|81|
|チョン避け|〃|〃|〃|2|82|
|チョン避け|〃|〃|〃|3|83|
|チョン避け|〃|〃|〃|4|84|
|嘘避け|1Dを振って偶数が出ると「回避x:全」を含む全てのスペカを回避できる.<br>残機1の時は判定不要でスペカを回避できる| |x|5|85|

|永夜返し|1D<相手が使用したスペカのLVで,LVに関わらず,任意のスペカで反撃できる| |x|2|86|
|永夜返し|〃|〃|x|3|87|
|永夜返し|〃|〃|x|4|88|
|永夜返し|〃|〃|x|5|89|
|決めボム|相手のスペカに対し,「このカード」「ボム1個」「任意のスペカ」を出せば,反撃を行うことができる(⚠そのスペカの使用を(ダイスチェックなどが必要なら)成立させる必要がある.持ちスペカをボムで撃つ事も可能)| |x|3|90|
|決めボム|〃|〃|〃|4|91|
|喰らいボム|スペカが自分に命中した時に,「このカード」「ボム1個」「任意のスペカ」を出せば,防御を行うことができる(⚠そのスペカの使用を(ダイスチェックなどが必要なら)成立させる必要がある.持ちスペカをボムで撃つ事も可能)|他の回避・防御・反撃失敗後でも使用できる|x|2|92|
|喰らいボム|〃|〃|〃|3|93|
|この程度,痛くはないけど痒いわ!|相手が使用した「持ちスペカ」を,スペカ本来のLV(キャラシートに記載)と同LVのスペカを捨札にすると防御できる|防御x:全 のスペカも防御できる|博麗霊夢|5|94|

|また妖怪の仕業ね!|使用する弾幕に「反撃x:全」を付加できる| |博麗霊夢|3|95|
|弾幕は火力だぜ|使用する弾幕に「防御x:全」を付加できる| |霧雨魔理沙|3|96|
|あなたの時間も私のもの…|使用するスペカに「回避x:全」を付加できる| |十六夜咲夜|3|97|
|斬れぬものなど,殆ど無い!|使用するうb術に「回避x:全」「防御x:武」「反撃x:部」を付加できる| |魂魄妖夢|3|98|
|常識に囚われてはいけないのですね!|使用したスペカのLVが,1Dを振って出た値になる.| |東風谷早苗|3|99|
|ゆっくりした結果がこれだよ!!!|相手はこの戦闘中,ボム・全ての特殊能力を使用できない<br>(持ちスペカの戦闘カードをLV5またはスペカ本来のLVで判定不要で使用することは可能)<br>(⚠ : 魔理沙の所持数上限が5個になると攻撃が成立した事典で通常の所持数上限に従って捨札にし,その後飛んできた弾幕に対処する.)| |x|6|100|
|手加減はしませんよ？|この戦闘中,自身のレベルが1上がる.| |東風谷早苗|3|101|

|いっぱいいっぱいなんだろ?|相手が判定に成功した時に使用すると, その判定をやり直させることができる|ダイスを複数回振る場合,その全てをやり直す|霧雨魔理沙|5|102|
|続けて再挑戦する|満身創痍に鳴った時に使用すると,残機が3になり,次の自分の手番で外周から登場する.|**復活判定**|x|4|103|
|ゆっくりしていってね!!!|相手は2D>精神力でこの戦闘が引き分け扱いで終了し,更に相手は次の手番は休みとなる.|霊夢・魔理沙・輝夜及び全てのNPCは判定扶養でゆっくりする.|x|4|104|
|やる,って言ったらやる時もまぁまぁあるの!|ダイスによる判定を要するカードと一緒に出すと判定を成功させることができる|ダイスを複数回振る場合,その全てを成功したものとして扱う|博麗霊夢|6|105|
|もう十分強くなったな免許皆伝じゃ|戦闘に敗れた時に使用すると,相手は2D≧(レベル+使用したスペカのLV)でこの戦闘が引き分け扱いで終了となる| |二ッ岩マミゾウ|4|106|
|…って慧音が言ってた.|相手が使用した,戦闘カード「戦闘補助」または「特殊」の効果を無効にすることができる|複数使われていたら,どれか1枚だけ無効にできる|ZUN|6|107|
|うふ,うふ,うふふふふ…。|戦闘に敗れた時に使用すると,この戦闘は相手にとって黒歴史になり「無かった事」になる.|戦闘なんて無かった.そうに違いない|霧雨魔(うわなにを ピチューン|5|108|
  */
  return tmp.map((x, i) => ({
    ...x,
    id: i,
    attribute: defaultSpellCard.attribute || null,
  }));
}
