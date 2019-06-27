export type CharaName = "霊夢" | "魔理沙" | "ルーミア"
export type Character = {
  id: number;
  name: CharaName;
  fullname: string;
  level: number; // レベル
  mental: number; // 精神力
}
export function getAllCharacters(): Character[] {
  let result: Character[] = [
    {
      id: 0,
      name: "霊夢",
      fullname: "博麗 霊夢",
      level: 4,
      mental: 7
    }, {
      id: 1,
      name: "魔理沙",
      fullname: "霧雨魔理沙",
      level: 4,
      mental: 7,
    }, {
      id: 2,
      name: "ルーミア",
      fullname: "ルーミア",
      level: 2,
      mental: 7
    }
  ]
  for (let i = 0; i < result.length; i++) console.assert(result[i].id === i);
  return result;
}
