import { CharaName } from "./character";
import { } from "./choice";
import { Ailment } from "./hook";
import * as _ from "underscore";
export type SpellCardColor = "R" | "B" | "Y" | "G" | "P" | "W"
export type SpellCardType = "弾幕" | "武術" | "回避" | "防御" | "戦闘補助" | "特殊"
export type SpellCardName =
  "夢想封印" | "マスタースパーク" | "ディマーケイション" | "アイシクルフォール" |
  "なし"
type SpellCardBase = {
  id?: number;
  name: SpellCardName;
  level: number;
  star: number;
  colors: SpellCardColor[];
  charaName: CharaName;
  attribute?: Ailment | null;
  cardTypes: SpellCardType[]; // チャージドクライとかある
}
export type SpellCard = Required<SpellCardBase>
export function getAllSpellCards(): SpellCard[] {
  let defaultSpellCard: SpellCardBase = {
    name: "ディマーケイション",
    level: 2,
    star: 1,
    colors: ["B", "G"],
    charaName: "ルーミア",
    attribute: "能力低下",
    cardTypes: ["弾幕"]
  };

  return _.range(100).map(i => {
    let tmp: SpellCard = {
      ...defaultSpellCard,
      id: i,
      attribute: defaultSpellCard.attribute || null
    }
    return tmp;
  });
}
