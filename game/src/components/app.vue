<template lang="pug">
  div
    nav.navbar.is-dark.is-fixed-top(role="navigation" aria-label="main navigation")
      .navbar-brand
        .navbar-item
          a.button.is-dark() 東方超人録電子化プロジェクト α版
        .navbar-item
          .field.is-grouped
            .control
              a.button.is-dark(href="https://github.com/Muratam/")
                .icon: i.fab.fa-github
    .section
      .content
        .field
          input.input(
              v-model="command"
              type="text"
              placeholder="input your command here!! (write 'help' and press enter)"
              @keyup.enter="onChangeCommand"
              )
        .field
          pre {{output}}
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
class Character {
  id: number = 0;
  name: string = "???";
  fullname: string = "???";
  level: number = 1; // レベル
  mental: number = 1; // 精神力
  static getAvailableCharacters(): string {
    let result = "";
    for (let i = 0; i < Character.maxId; i++) {
      let chara = new Character(i);
      result += `${i}:${chara.fullname}\n`;
    }
    return result;
  }
  static maxId = 2;
  constructor(id: number) {
    [this.initReimu, this.initCirno, this.initPathe][id]();
  }
  initReimu() {
    this.id = 0;
    this.name = "霊夢";
    this.fullname = "博麗 霊夢";
    this.level = 4;
    this.mental = 7;
  }
  initCirno() {
    this.id = 1;
    this.name = "チルノ";
    this.fullname = "チルノ";
    this.level = 1;
    this.mental = 9;
  }
  initPathe() {
    this.id = 2;
    this.name = "パチュリー";
    this.fullname = "パチュリー・ノーレッジ";
    this.level = 5;
    this.mental = 5;
  }
  toString(): string {
    let result = "{";
    for (let key in this) {
      if (typeof this[key] === "function") continue;
      result += `${key}:${this[key]},`;
    }
    return result + "}";
  }
}
class Player {
  chara: Character;
  currentLandPos = { x: -1, y: -1 }; // 現在地(盤外:{-1,-1})
  constructor(charaId: number) {
    this.chara = new Character(charaId);
  }
  toString(): string {
    return `${this.chara}`;
  }
}
class Land {}
class Game {
  players: Player[];
  isValid: boolean = false;
  map: Land[][]; // 空きマスはnull
  constructor(ids: number[]) {
    if (ids.length <= 1) return; // 一人プレイは不可能
    if (ids.length !== Array.from(new Set(ids)).length) return; // 同じキャラは不可能
    if (ids.some(x => x < 0 || x > Character.maxId)) return;
    this.players = ids.map(x => new Player(x));
    this.map = new Array(6).map(x => new Array(6).map(x => null));
    this.isValid = true;
  }
  showStatus(): string {
    return this.players.map((x, i) => `${i + 1}P:${x}`).join("\n");
  }
  showMap(): string {
    return "";
  }
  showOptions(): string {
    return "";
  }
  showAll(): string {
    return `# status\n${this.showStatus()}\n# map\n${this.showMap()}\n# option\n${this.showOptions()}`;
  }
}
@Component({})
export default class App extends Vue {
  game: Game = null; // WARN:　かなり巨大なオブジェクトで、これがVue管理下にあるコストは考えたほうがいい
  command = "";
  output = "";
  getHelp(): string {
    return `# help
    play 0 2 1: (今あるゲームを終了させて)新しい3人ゲームを開始. idに対応するキャラクタが選ばれる。
    show available characters: 現在実装されているキャラクター一覧を表示
    show : status map options を全て表示
      //show status : 全員の状態を表示
      //show map : 現在のマップを表示
      //show options: 全員の現在の選択肢を表示
    //<空のコマンド> : 全員がデフォルトの選択肢を選んで次の状態へ
    //3 4: 3pの選択肢のうち4番を選ぶ
    `.replace(/\n    /g, "\n");
  }
  parseCommand(command: string): [boolean, string] {
    command = command
      .toLowerCase()
      .replace(/\s\s/g, " ")
      .trim();
    let c = command.split(" ");
    if (c[0] === "help") return [true, this.getHelp()];
    if (c[0] === "play") {
      let game = new Game(c.slice(1).map(x => parseInt(x)));
      if (!game.isValid) {
        this.game = null;
        return [false, "ゲームを開始できなかった..."];
      }
      this.game = game;
      return [true, "新たなゲームを開始しました！ \n" + this.game.showAll()];
    }
    if (command === "show available characters") {
      return [true, Character.getAvailableCharacters()];
    }
    if (this.game === null) return [false, "まだゲームが始まっていない"];
    if (command === "show") return [true, this.game.showAll()];
    return [false, "そんなコマンドはない"];
  }
  onChangeCommand(): void {
    let command = this.command;
    let [success, parsed] = this.parseCommand(command);
    if (!success) {
      this.output = `${parsed}\n(${this.command})\n\n` + this.getHelp();
    } else {
      this.output = parsed;
    }
    this.command = "";
  }
}
</script>

<style lang="scss" scoped>
.greeting {
  font-size: 20px;
}
textarea,
input {
  font-family: "Menlo", "Courier New", Consolas, monospace;
}
canvas {
  background: black;
  border-color: #dbdbdb;
  border-radius: 4px;
  box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.1);
  width: 100%;
}
</style>
