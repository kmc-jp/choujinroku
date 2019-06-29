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
    .field.is-grouped
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
      .control(v-for="i in playerNumber")
        a.button.is-light(@click="showPlayerInfo(i-1)" v-bind:style="getColor(i-1)")
          .icon: i.fas.fa-user
          p {{i}}P
      .control
        a.button.is-light(@click="showLog")
          .icon: i.fas.fa-history
          p ログ
    .field
      pre( v-html="map")
    div(style="position:absolute;left:50vw;width:50vw;padding:0.8em")
      .field(v-if="infoType=='Log'")
        pre(style="max-height:20em;")
          p(v-for="l in log" v-bind:style="parseLogToColor(l)") {{l}}
      .field(v-if="infoType=='PlayerInfo'")
        pre(v-bind:style="getColor(infoPlayerIndex)") {{info}}
    .field(v-for="choice,i in choices")
      .control
        a.button(@click="decide(i)" v-bind:style="getColor(toPlayerId[i])")
          .icon: i.fas.fa-question
          p {{choice}}

</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { GameProxy } from "../gameproxy";

//　かなり巨大なオブジェクトで、これがVue管理下にあるコストは考えたほうがいい
let gameProxy: GameProxy | null = null;

type InfoType = "Log" | "PlayerInfo" | "Invisible";
@Component({})
export default class App extends Vue {
  command = "";
  map = "";
  infoType: InfoType = "Log";
  choices: string[] = [];
  toPlayerId: number[] = [];
  toChoiceId: number[] = [];
  log: string[] = [];
  info = "";
  infoPlayerIndex = 0;
  playerNumber = 0;
  isShowChoices = true;
  autoMode = false;
  showMap() {
    if (!gameProxy) return;
    let map = gameProxy.showMap();
    map = map.replace(/(\d)/g, (m, p) => {
      let i = +m;
      return `<span style="${this.getColor(i - 1)}">${i}</span>`;
    });
    this.map = map;
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
  updateLog() {
    if (!gameProxy) return;
    this.log = gameProxy.getLog();
  }
  hideInfo() {
    this.infoType = "Invisible";
  }
  showLog() {
    if (!gameProxy) return;
    this.infoType = "Log";
    this.updateLog();
  }
  updatePlayerInfo() {
    this.info = gameProxy
      ? gameProxy.showPlayer(this.infoPlayerIndex)
      : "ゲーム未開始";
  }
  showPlayerInfo(n: number) {
    this.infoType = "PlayerInfo";
    this.infoPlayerIndex = n;
    this.updatePlayerInfo();
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
    this.updateLog();
    this.updatePlayerInfo();
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
  parseLogToColor(l: String): string {
    return this.getColor(+l.split("P")[0] - 1);
  }
  getColor(i: number): string {
    if (this.playerNumber <= 0) return ``;
    return `color:hsl(${Math.floor((i * 360) / this.playerNumber)},100%,32%)`;
  }
  onChangeCommand() {
    let command = this.command.replace(/\s\s/g, " ").trim();
    if (command === "" && gameProxy === null) command = "0 1 2";
    let c = command.split(" ");
    let tmp = GameProxy.tryToStart(c.map(x => parseInt(x)));
    if (tmp === null) return (this.info = "ゲームを開始できなかった...");
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
