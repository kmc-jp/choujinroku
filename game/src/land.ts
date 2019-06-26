type LandData = {
  id: number;
  name: string;
}
const unknownLand: LandData = { id: -1, name: "???" }
const landDatus: LandData[] = [
  { id: 0, name: "博麗神社" },
  { id: 1, name: "魔法の森" },
  { id: 2, name: "月夜の森" },
  { id: 3, name: "霧の湖" },
  { id: 4, name: "未実装4" },
  { id: 5, name: "未実装5" },
  { id: 6, name: "未実装6" },
  { id: 7, name: "未実装7" },
  { id: 8, name: "未実装8" },
  { id: 9, name: "未実装9" },
  { id: 10, name: "未実装10" },
  { id: 11, name: "未実装11" },
  { id: 12, name: "未実装12" },
  { id: 13, name: "未実装13" },
  { id: 14, name: "未実装14" },
  { id: 15, name: "未実装15" },
  { id: 16, name: "未実装16" },
  { id: 17, name: "未実装17" },
  { id: 18, name: "未実装18" },
  { id: 19, name: "未実装19" },
  { id: 20, name: "未実装20" },
  { id: 21, name: "未実装21" },
  { id: 22, name: "未実装22" },
  { id: 23, name: "未実装23" },
  { id: 24, name: "未実装24" },
  { id: 25, name: "未実装25" },
  { id: 26, name: "未実装26" },
  { id: 27, name: "未実装27" },
  { id: 28, name: "未実装28" },
  { id: 29, name: "未実装29" },
  { id: 30, name: "未実装30" },
  { id: 31, name: "未実装31" },
  { id: 32, name: "未実装32" },
  { id: 33, name: "未実装33" },
  { id: 34, name: "未実装34" },
  { id: 35, name: "未実装35" },
];

export class Land implements LandData {
  id: number;
  name: string;
  isValid: boolean;
  constructor(id: number) {
    let data: LandData;
    this.isValid = 0 <= id && id < landDatus.length;
    if (this.isValid) data = landDatus[id];
    else data = unknownLand;
    this.id = data.id;
    this.name = data.name;
  }
  toString(): string { return this.name; }
}
