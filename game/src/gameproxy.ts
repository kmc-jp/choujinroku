import { Game } from "./game";
import { characterDatus } from "./character";
import { Choice } from "./choice";
export class GameProxy {
  private game: Game;
  constructor(ids: number[]) {
    this.game = new Game(ids);
  }
  // Proxy
  decideAll(): string {
    // 全員がランダムに(1Pから順に)選択肢を選ぶ
    for (let i = 0; i < this.game.players.length; i++) {
      if (this.game.choices[i].length === 0) continue;
      return this.decide(i, Math.floor(Math.random() * this.game.choices[i].length));
    }
    return "選ぶものが無かった";
  }
  decide(playerIndex: number, choiceIndex: number): string {
    let choice = this.game.choices[playerIndex][choiceIndex];
    this.game.choices[playerIndex] = [];
    choice.invoke();
    return `${this.game.players[playerIndex].name} : ${choice}を選択`
  }
  showStatus(): string {
    return this.game.players.map(x => `${x}`).join("\n");
  }
  showMap(): string {
    let out: string[] = [];
    this.game.players.forEach(x => { if (this.game.isOutOfLand(x.currentLandPos)) out.push(x.name) })
    let result = `盤外:${out.join(",")}\n`;
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 6; x++) {
        let heres = this.game.players.filter(p => p.currentLandPos.x === x && p.currentLandPos.y === y)
          .map(p => `${p.name}`).join(",")
        if (heres !== "") heres = `(${heres})`
        result += `[${this.game.map[x][y]}${heres}] `
      }
      result += "\n"
    }
    return result;
  }
  getIsValid(): boolean { return this.game.isValid; }
  getPlayerNumber(): number { return this.game.players.length; }
  getChoices(i: number): Choice[] { return this.game.choices[i]; }
  showChoices(): string {
    return this.game.choices.map((x, i) => `${this.game.players[i].name}:\n${
      "[ " + x.map((x, i) => `${i}:${x}`).join("\n  ") + " ]"
      }`).join("\n");
  }
  showAll(): string {
    return `# status\n${this.showStatus()}\n# map\n${this.showMap()}\n# choice\n${this.showChoices()}`;
  }
  static getAvailableCharacters(): string { return characterDatus.map(x => `${x}`).join("\n"); }

}
