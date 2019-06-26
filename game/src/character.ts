export type CharacterData = {
  id: number;
  name: string;
  fullname: string;
  level: number; // レベル
  mental: number; // 精神力
}
export const characterDatus: CharacterData[] = [
  {
    id: 0,
    name: "霊夢",
    fullname: "博麗 霊夢",
    level: 4,
    mental: 7
  }, {
    id: 1,
    name: "チルノ",
    fullname: "チルノ",
    level: 1,
    mental: 9,
  }, {
    id: 2,
    name: "パチュリー",
    fullname: "パチュリー・ノーレッジ",
    level: 5,
    mental: 5
  }
]
export class Character implements CharacterData {
  id: number;
  name: string;
  fullname: string;
  level: number; // レベル
  mental: number; // 精神力
  constructor(characterId: number) {
    let data = characterDatus[characterId];
    this.id = data.id;
    this.name = data.name;
    this.fullname = data.fullname;
    this.level = data.level;
    this.mental = data.mental;
    console.assert(this.id === characterId);
  }
  toString(): string {
    let result = "{";
    for (let key in this) {
      if (typeof this[key] === "function") continue;
      result += `${key}:${this[key]},`;
    }
    return (result + "}").replace(/,}/g, "}");
  }
}
