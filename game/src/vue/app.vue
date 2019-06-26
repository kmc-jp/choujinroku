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
import { GameProxy } from "../gameproxy";

//　かなり巨大なオブジェクトで、これがVue管理下にあるコストは考えたほうがいい
let gameProxy: GameProxy | null = null;

@Component({})
export default class App extends Vue {
  command = "";
  output = "";
  getHelp(): string {
    return `# help
    play 0 2 1: 新しい3人ゲームを開始. idに対応するキャラクタが選ばれる。
    show available characters: 現在実装されているキャラクター一覧を表示
    show : status map options を全て表示
      show status : 全員の状態を表示
      show map : 現在のマップを表示
      show options: 全員の現在の選択肢を表示
    <空のコマンド> : 全員がランダムに選択肢を選んで次の状態へ
    3 4: 3pの選択肢のうち4番を選ぶ
    auto : 永遠にランダム選択肢を選び続ける
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
      if (gameProxy != null)
        return [false, "既にゲームは開始されている！(リロードしてね)"];
      let tmp = GameProxy.tryToStart(c.slice(1).map(x => parseInt(x)));
      if (tmp === null) return [false, "ゲームを開始できなかった..."];
      gameProxy = tmp;
      return [true, "新たなゲームを開始しました！ \n" + gameProxy.showAll()];
    }
    if (command === "show available characters") {
      return [true, GameProxy.getAvailableCharacters()];
    }
    if (gameProxy === null) return [false, "まだゲームが始まっていない"];
    if (command === "show") {
      if (c[1] === "status") return [true, gameProxy.showStatus()];
      if (c[1] === "map") return [true, gameProxy.showMap()];
      if (c[1] === "choices") return [true, gameProxy.showChoices()];
      return [true, gameProxy.showAll()];
    }
    if (command === "auto") {
      let f = () => {
        this.command = "";
        this.onChangeCommand();
        requestAnimationFrame(f);
      };
      f();
      return [true, "auto loop"];
    }
    if (command === "") {
      return [true, gameProxy.decideAll() + "\n" + gameProxy.showAll()];
    }
    let n = parseInt(command[0]) - 1;
    if (0 <= n && n < gameProxy.getPlayerNumber()) {
      let m = parseInt(c[1]);
      if (m < 0 || m >= gameProxy.getChoices(n).length)
        return [false, "そんな選択肢は無い"];
      return [true, gameProxy.decide(n, m) + "\n" + gameProxy.showAll()];
    }
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
