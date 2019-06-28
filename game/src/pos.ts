export type PosType = { x: number, y: number }
export class Pos implements PosType {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  toString(): string {
    return `{x:${this.x},y:${this.y}}`
  }
  // 盤外か
  isOutOfLand(): boolean {
    return this.x < 0 || this.x >= 6 || this.y < 0 || this.y >= 6;
  }
  // 一番外側の位置リスト
  static getOutSides(): Pos[] {
    let result: { x: number, y: number }[] = [];
    for (let x = 0; x < 6; x++) result.push({ x: x, y: 0 });
    for (let x = 0; x < 6; x++) result.push({ x: x, y: 5 });
    for (let y = 1; y < 5; y++) result.push({ x: 0, y: y });
    for (let y = 1; y < 5; y++) result.push({ x: 5, y: y });
    return result.map(p => new Pos(p.x, p.y));
  }
  // 上下左右で隣接した位置
  getNextTo(): Pos[] {
    return [{ x: -1, y: 0 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }]
      .map(x => ({ x: x.x + this.x, y: x.y + this.y }))
      .map(p => new Pos(p.x, p.y))
      .filter(x => !x.isOutOfLand());
  }
  // 同一の位置
  equal(pos: Pos): boolean {
    return this.x === pos.x && this.y === pos.y;
  }
  get raw(): PosType { return { x: this.x, y: this.y } }
}
