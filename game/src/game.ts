import { Character, characterDatus } from "./character";
import { Player, Choice, ChoiceType } from "./player";
import { Land } from "./land";

function newArray<T>(n: number, f: ((index: number) => T)): T[] {
  let res = [];
  for (let i = 0; i < n; i++) res.push(f(i));
  return res;
}
function shuffle<T>(array: T[]): T[] {
  let i = array.length, tmp, ri;
  while (0 !== i) {
    ri = Math.floor(Math.random() * i);
    i -= 1;
    tmp = array[i];
    array[i] = array[ri];
    array[ri] = tmp;
  }
  return array;
}


// 現在はブラウザで動いているが、サーバーで動いてもいい感じになってほしい気持ちで書く
/* 処理の流れ:
  players選択 : new Game([0,1,2,...])
  初期位置決定 : makeFirstPlaceChoice()
  初期土地開示 : openInitialLands
*/
export class Game {
  players: Player[] = [];
  isValid: boolean = false;
  map: Land[][] = [];
  leftLands: Land[] = [];
  choices: Choice[][] = [];
  constructor(ids: number[]) {
    if (ids.length <= 1) return; // 一人プレイは不可能
    if (ids.length !== Array.from(new Set(ids)).length) return; // 同じキャラは不可能
    if (ids.some(x => x < 0 || x >= characterDatus.length)) return;
    this.players = ids.map(x => new Player(x, `${x + 1}P`));
    this.map = newArray(6, () => newArray(6, () => new Land(-1)));
    this.choices = newArray(this.players.length, () => []);
    this.choices[0] = this.makeFirstPlaceChoice(0);
    this.leftLands = shuffle(newArray(36, i => new Land(i)));
    this.isValid = true;
  }
  makeFirstPlaceChoice(playerIndex: number): Choice[] {
    // 初期配置選択肢
    // 1Pから開始位置(x:[0,5],y:[0,5])を選んでもらう
    let xys: { x: number, y: number }[] = [];
    for (let x = 0; x < 6; x++) xys.push({ x: x, y: 0 });
    for (let x = 0; x < 6; x++) xys.push({ x: x, y: 5 });
    for (let y = 1; y < 5; y++) xys.push({ x: 0, y: y });
    for (let y = 1; y < 5; y++) xys.push({ x: 5, y: y });
    return xys.map(x => new Choice("初期配置位置", x, x => {
      this.players[playerIndex].currentLandPos = { x: +x.x, y: +x.y };
      if (playerIndex < this.players.length - 1)
        this.choices[playerIndex + 1] = this.makeFirstPlaceChoice(playerIndex + 1);
      else {
        for (let player of this.players) {
          this.openRandomLand(player.currentLandPos.x, player.currentLandPos.y);
        }
      }
    }));
  }
  openRandomLand(x: number, y: number) {
    if (this.map[x][y].isValid) return; // 既に存在している
    let land = this.leftLands[this.leftLands.length - 1];
    this.leftLands.pop();
    this.map[x][y] = land;
  }
}
