<template lang="pug">
  div
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { GameProxy } from "../gameproxy";
import * as _ from "underscore";
import * as I from "ibukidom";
import { threeBoxSampleScene } from "./loop";
let gameProxy: GameProxy | null = null;
type InfoType = "Log" | "PlayerInfo" | "Invisible";
new I.World().play(scene => threeBoxSampleScene(scene));

@Component({})
export default class App extends Vue {}
</script>

<style lang="scss" scoped>
</style>
