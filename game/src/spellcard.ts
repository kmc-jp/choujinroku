import { CharaName } from "./character";
import { } from "./choice";
import { Ailment } from "./hook";
import * as _ from "underscore";
import { random } from "./util";
export type SpellCardColor = "R" | "B" | "Y" | "G" | "P" | "W"
export type SpellCardType = "弾幕" | "武術" | "回避" | "防御" | "戦闘補助" | "特殊"
export type SpellCardName =
  "夢想封印" | "マスタースパーク" | "ディマーケイション" | "アイシクルフォール" |
  "飛花落葉" | "賢者の石" | "殺人ドール" | "紅色の幻想郷" | "そして誰もいなくなるか？" |
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

  return _.range(100).map(i => {
    let tmp: SpellCard = {
      ...defaultSpellCard,
      id: i,
      attribute: defaultSpellCard.attribute || null,
      level: random(6) + 1
    }
    return tmp;
  });
}
