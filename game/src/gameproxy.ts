import { Game } from "./game";
import { characterDatus, Character } from "./character";
export class GameProxy extends Game {
  // Proxy
  decideAll(): string {
    // 全員がランダムに(1Pから順に)選択肢を選ぶ
    for (let i = 0; i < this.players.length; i++) {
      if (this.choices[i].length === 0) continue;
      return this.decide(i, Math.floor(Math.random() * this.choices[i].length));
    }
    return "選ぶものが無かった";
  }
  decide(playerIndex: number, choiceIndex: number): string {
    let choice = this.choices[playerIndex][choiceIndex];
    this.choices[playerIndex] = [];
    choice.invoke();
    return `${this.players[playerIndex].name} : ${choice}を選択`
  }
  showStatus(): string {
    return this.players.map(x => `${x}`).join("\n");
  }
  showMap(): string {
    let out: string[] = [];
    this.players.forEach(x => { if (x.isOutOfLand()) out.push(x.name) })
    let result = `盤外:${out.join(",")}\n`;
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 6; x++) {
        let heres = this.players.filter(p => p.currentLandPos.x === x && p.currentLandPos.y === y)
          .map(p => `${p.name}`).join(",")
        if (heres !== "") heres = `(${heres})`
        result += `[${this.map[x][y]}${heres}] `
      }
      result += "\n"
    }
    return result;
  }
  showChoices(): string {
    return this.choices.map((x, i) => `${this.players[i].name}:\n${
      "[ " + x.map((x, i) => `${i}:${x}`).join("\n  ") + " ]"
      }`).join("\n");
  }
  showAll(): string {
    return `# status\n${this.showStatus()}\n# map\n${this.showMap()}\n# choice\n${this.showChoices()}`;
  }
  static getAvailableCharacters(): string { return characterDatus.map(x => `${x}`).join("\n"); }

}
