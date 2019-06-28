<template lang="pug">
  div(style="margin:0.72em;")
    nav.navbar.is-dark.is-fixed-top(role="navigation" aria-label="main navigation")
      .navbar-brand
        .navbar-item
          a.button.is-dark() 東方超人録電子化プロジェクト α版
        .navbar-item
          .field.is-grouped
            .control
              a.button.is-dark(href="https://github.com/Muratam/")
                .icon: i.fab.fa-github
    //- 選択肢の表示ボタン(全員の選択肢) : オーバーレイ形式
    //- 1,2,3Pの詳細ボタン
    //- その他の情報の表示ボタン
    //- 地図の表示ボタン
    //- オートボタン
    //- ランダム選択ボタン
    .field.is-grouped
      .control(style="margin-top:0.5em;")
        input.switch#showChoice(type="checkbox" checked="checked" @change="toglleShowChoices")
        label(for="showChoice") 選択肢表示
      .control(style="margin-top:0.5em;")
        input.switch#useAuto(type="checkbox" @change="toggleAutoMode")
        label(for="useAuto") オート進行
      .control
        a.button.is-light(@click="choiceRandom")
          p ランダム
      .control
        input.input(
          v-model="command"
          type="text"
          size="8"
          placeholder="0 1 2 3"
          @keyup.enter="onChangeCommand"
          )
    .field.is-grouped
      .control
        a.button.is-light(@click="showMap")
          .icon: i.fas.fa-image
          p ゲーム画面
      .control(v-for="i in playerNumber")
        a.button.is-light(@click="showPlayer(i-1)")
          .icon: i.fas.fa-user
          p {{i}}P
      .control
        a.button.is-light(@click="showStatus")
          .icon: i.fas.fa-cog
          p その他
    .field
      pre {{output}}
    .field(v-for="choice,i in choices")
      .control
        a.button.is-light(@click="decide(i)")
          .icon: i.fas.fa-question
          p  {{choice}}
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
  choices: string[] = [];
  toPlayerId: number[] = [];
  toChoiceId: number[] = [];
  playerNumber = 0;
  isShowChoices = true;
  autoMode = false;
  showMap() {
    this.output = gameProxy ? gameProxy.showMap() : "ゲーム未開始";
  }
  showChoice() {
    if (!gameProxy || !this.isShowChoices) return (this.choices = []);
    let choiceMat = gameProxy.getChoices();
    let choices: string[] = [];
    let toPlayerId: number[] = [];
    let toChoiceId: number[] = [];
    choiceMat.forEach((cm, i) => {
      cm.forEach((c, j) => {
        choices.push(`${i + 1}P: ${c}`);
        toPlayerId.push(i);
        toChoiceId.push(j);
      });
    });
    this.choices = choices;
    this.toPlayerId = toPlayerId;
    this.toChoiceId = toChoiceId;
  }
  decide(i: number) {
    if (!gameProxy) return;
    gameProxy.decide(this.toPlayerId[i], this.toChoiceId[i]);
    this.update();
  }
  showStatus() {
    this.output = gameProxy ? gameProxy.showStatus() : "ゲーム未開始";
  }
  showPlayer(n: number) {
    this.output = gameProxy ? gameProxy.showPlayer(n) : "ゲーム未開始";
  }
  toglleShowChoices() {
    this.isShowChoices = !this.isShowChoices;
    this.showChoice();
  }
  toggleAutoMode() {
    this.autoMode = !this.autoMode;
  }
  update() {
    this.showMap();
    this.showChoice();
  }
  choiceRandom() {
    if (!gameProxy) return;
    gameProxy.decideAll();
    this.update();
  }
  mounted() {
    let f = () => {
      if (this.autoMode) this.choiceRandom();
      requestAnimationFrame(f);
    };
    f();
    this.onChangeCommand();
  }
  onChangeCommand() {
    let command = this.command.replace(/\s\s/g, " ").trim();
    if (command === "" && gameProxy === null) command = "0 1 2";
    let c = command.split(" ");
    let tmp = GameProxy.tryToStart(c.map(x => parseInt(x)));
    if (tmp === null) return (this.output = "ゲームを開始できなかった...");
    gameProxy = tmp;
    this.playerNumber = gameProxy.getPlayerNumber();
    this.update();
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
