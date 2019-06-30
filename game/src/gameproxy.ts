import { Game } from "./game";
import { getAllCharacters } from "./character";
import { Choice } from "./choice";
import { toString } from "./util";
import * as _ from "underscore"


export class GameProxy {
  private game: Game;
  private constructor(game: Game) {
    this.game = game;
  }
  static tryToStart(ids: number[]): GameProxy | null {
    let game = Game.tryToStartGame(ids);
    if (game === null) return null;
    return new GameProxy(game);
  }
  // Proxy
  decideAll(): string {
    // 全員がランダムに(1Pから順に)選択肢を選ぶ
    for (let player of this.game.players) {
      if (player.choices.length === 0) continue;
      return this.decide(player.id, Math.floor(Math.random() * player.choices.length));
    }
    return "選ぶものが無かった";
  }
  decide(playerId: number, choiceId: number): string {
    let player = this.game.players[playerId];
    let choice = player.choices[choiceId];
    this.game.decide(playerId, choiceId);
    return `${player.name} : ${choice}を選択`
  }
  showStatus(): string {
    return `
    TURN: ${this.game.turn}
    ACTIONSTACK:${this.game.actionStack.length}
    TEMPACTIONS:${this.game.temporaryActionStack.length}
    残り宝物:[${this.game.leftItems["宝物"].map(x => x.name).join(",")}]
    残り発明品:[${this.game.leftItems["発明品"].map(x => x.name).join(",")}]
    残り本:[${this.game.leftItems["本"].map(x => x.name).join(",")}]
    残り品物:[${this.game.leftItems["品物"].map(x => x.name).join(",")}]
    `.replace(/\n    /g, "\n") + this.game.players.map(x => `${x}`).join("\n");
  }
  showPlayer(playerId: number): string {
    if (playerId < 0 || playerId >= this.game.players.length) return "不正なプレイヤー番号です"
    return this.game.players[playerId].toString();
  }
  showMap(): string {
    let out: string[] = [];
    this.game.players.forEach(x => { if (x.pos.isOutOfLand()) out.push(x.name) })
    let result = `盤外:${out.join(",")}\n`;
    let mat = _.range(6).map(x => _.range(6).map(x => ""));
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 6; x++) {
        let heres = this.game.players.filter(p => p.pos.x === x && p.pos.y === y)
          .map(p => `${p.name.slice(0, 1)}`).join("")
        if (heres !== "") heres = ` ${heres} `
        let item = this.game.itemsOnMap[x][y];
        let map = this.game.map[x][y];
        let name = map === null ? "　　" : map.name.slice(0, 2);
        let value = `${item === null ? " " : "!"}${name}${heres}`
        mat[y][x] = value;
      }
    }
    for (let x = 0; x < 6; x++) {
      let maxLength = Math.max(..._.range(6).map(y => mat[y][x].length));
      for (let y = 0; y < 6; y++) {
        mat[y][x] = mat[y][x] + " ".repeat(Math.max(0, maxLength - mat[y][x].length))
      }
    }
    for (let y = 0; y < 6; y++) {
      result += "|"
      for (let x = 0; x < 6; x++) {
        result += `${mat[y][x]}|`
      }
      result += "\n"
    }
    return result;
  }
  getPlayerNumber(): number { return this.game.players.length; }
  getChoices(): string[][] {
    return this.game.players.map(player => {
      return player.choices.map(x => `${x}`)
    })
  }
  showChoices(): string {
    return this.game.players.map(x => `${x.name}:\n${
      "[ " + x.choices.map((x, i) => `${i}:${x}`).join("\n  ") + " ]"
      }`).join("\n");
  }
  getLog(n: number = 1000): string[] {
    let result: string[] = []
    for (let i = 0; i < Math.min(n, this.game.choiceLog.length); i++) {
      let j = this.game.choiceLog.length - 1 - i;
      result.push(this.game.choiceLog[j].replace(":", `:${j}:`));
    }
    return result;
  }
  showAll(): string {
    return `# status\n${this.showStatus()}\n# map\n${this.showMap()}\n# choice\n${this.showChoices()}`;
  }
  static getAvailableCharacters(): string[] { return getAllCharacters().map(x => `${toString(x)}`); }

}
