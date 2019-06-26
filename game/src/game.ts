import { Character, characterDatus } from "./character";
import { Player, PlayerAction } from "./player";
import { Choice, ChoiceType } from "./choice";
import { Land } from "./land";
import * as _ from "underscore";

// 現在はブラウザで動いているが、サーバーで動いてもいい感じになってほしい気持ちで書く
export class Game {
  players: Player[] = [];
  isValid: boolean = false;
  map: Land[][] = [];
  leftLands: Land[] = [];
  choices: Choice[][] = [];
  constructor(ids: number[]) {
    if (ids.length <= 1) return; // 一人プレイは不可能
    if (ids.length !== _.uniq(ids).length) return; // 同じキャラは不可能
    if (ids.some(x => x < 0 || x >= characterDatus.length)) return;
    this.players = ids.map((x, i) => new Player(x, `${i + 1}P`, i));
    this.map = _.range(6).map(() => _.range(6).map(() => new Land(-1)));
    this.choices = _.range(this.players.length).map(() => []);
    this.leftLands = _.shuffle(_.range(36).map(i => new Land(i)));
    this.isValid = true;
    this.askFirstPlace(0);
  }
  isOutOfLand(p: { x: number, y: number }): boolean {
    return p.x < 0 || p.x >= 6 || p.y < 0 || p.y >= 6;
  }
  finishPlayerTurn(playerIndex: number) {
    let player = this.players[playerIndex];
    player.actions = [];
    let next = (playerIndex + 1) % this.players.length;
    this.askPlayerTurn(next);
  }
  askPlayerTurn(playerIndex: number) {
    let player = this.players[playerIndex];
    this.choices[playerIndex] = [
      new Choice("待機", {}, x => {
        player.actions.push("待機");
        this.finishPlayerTurn(playerIndex);
      })
    ];
    let moveTag: PlayerAction = player.actions.includes("移動1") ? "移動2" : "移動1";
    // WARN 同一の選択肢を生むかも
    let nextTos = [{ x: -1, y: 0 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }].map(x => ({
      x: x.x + player.currentLandPos.x, y: x.y + player.currentLandPos.y
    })).filter(x => !this.isOutOfLand(x))
    this.choices[playerIndex].push(...nextTos.map(p =>
      new Choice(moveTag, { x: p.x, y: p.y }, x => {
        player.actions.push(moveTag);
        this.openRandomLand(+x.x, +x.y);
        player.currentLandPos = { x: +x.x, y: +x.y };
        if (player.actions.length < 2) this.askPlayerTurn(playerIndex);
        else this.finishPlayerTurn(playerIndex);
      }))
    );
  }
  askFirstPlace(playerIndex: number) {
    // 初期配置選択肢
    // 1Pから開始位置(x:[0,5],y:[0,5])を選んでもらう
    let xys: { x: number, y: number }[] = [];
    for (let x = 0; x < 6; x++) xys.push({ x: x, y: 0 });
    for (let x = 0; x < 6; x++) xys.push({ x: x, y: 5 });
    for (let y = 1; y < 5; y++) xys.push({ x: 0, y: y });
    for (let y = 1; y < 5; y++) xys.push({ x: 5, y: y });
    this.choices[playerIndex] = xys.map(x => new Choice("初期配置位置", x, x => {
      this.players[playerIndex].currentLandPos = { x: +x.x, y: +x.y };
      if (playerIndex < this.players.length - 1) {
        this.askFirstPlace(playerIndex + 1);
        return;
      }
      for (let player of this.players) {
        this.openRandomLand(player.currentLandPos.x, player.currentLandPos.y);
      }
      // 1Pからターンを開始
      this.askPlayerTurn(0);
    }));
  }
  openRandomLand(x: number, y: number): boolean {
    if (this.map[x][y].isValid) return false; // 既に存在している
    let land = this.leftLands[this.leftLands.length - 1];
    this.leftLands.pop();
    this.map[x][y] = land;
    return true;
  }
}
