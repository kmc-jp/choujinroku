import { Game } from "./game";
import { characterDatus } from "./character";
import { Choice } from "./choice";
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
    player.choices = [];
    choice.invoke();
    this.game.consumeActionStackSafety();
    return `${this.game.players[playerId].name} : ${choice}を選択`
  }
  showStatus(): string {
    return `TURN: ${this.game.turn}\nSTACK:${this.game.actionStack.length}\n ` + this.game.players.map(x => `${x}`).join("\n");
  }
  showMap(): string {
    let out: string[] = [];
    this.game.players.forEach(x => { if (this.game.isOutOfLand(x.currentPos)) out.push(x.name) })
    let result = `盤外:${out.join(",")}\n`;
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 6; x++) {
        let heres = this.game.players.filter(p => p.currentPos.x === x && p.currentPos.y === y)
          .map(p => `${p.name}`).join(",")
        if (heres !== "") heres = `(${heres})`
        let item = this.game.itemsOnMap[x][y];
        let map = this.game.map[x][y];
        result += `[${map === null ? "" : map}${heres}${item === null ? "" : "(" + item.name + ")"}] `
      }
      result += "\n"
    }
    return result;
  }
  getPlayerNumber(): number { return this.game.players.length; }
  getChoices(i: number): Choice[] { return this.game.players[i].choices; }
  showChoices(): string {
    return this.game.players.map(x => `${x.name}:\n${
      "[ " + x.choices.map((x, i) => `${i}:${x}`).join("\n  ") + " ]"
      }`).join("\n");
  }
  showAll(): string {
    return `# status\n${this.showStatus()}\n# map\n${this.showMap()}\n# choice\n${this.showChoices()}`;
  }
  static getAvailableCharacters(): string { return characterDatus.map(x => `${x}`).join("\n"); }

}
