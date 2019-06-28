import { Character } from "./character";
export type PlayerActionTag = "移動1" | "待機" | "移動2" | "戦闘" | "アイテム" | "特殊能力の使用"
import { Choice, Attribute, ResistanceHook } from "./choice";
import { Item } from "./item";
import { toString } from "./util";
import * as _ from "underscore";
import { Game } from "./game";
import { Pos } from "./pos";
import { SpellCard } from "./spellcard";
function setToArray<T>(set: Set<T>): T[] {
  let result: T[] = [];
  set.forEach(w => { result.push(w); });
  return result.sort();
}

Set.prototype.toString = function () {
  let result = "{";
  this.forEach(x => result += x + ",");
  return result + "}";
}

export class WithAttribute {
  player: Player;
  attrs: Attribute[];
  constructor(player: Player, ...attributes: Attribute[]) {
    this.player = player;
    this.attrs = attributes;
  }
  set choices(value: Choice<any> | Choice<any>[]) {
    this.player.choices = this.wrap(value);
  }
  wrap(value: Choice<any> | Choice<any>[]): Choice<any>[] {
    if (!(value instanceof Array)) value = [value];
    return this.player.checkResistanceHooks(value, this.attrs);
  }
  with(...attributes: Attribute[]): WithAttribute {
    return new WithAttribute(this.player, ...this.attrs.concat(attributes));
  }
}

export class Player {
  name: string;
  private character: Character; // レベル+1などがありうるので外部から直接参照できないように
  isAbleToAction: boolean; // 戦闘敗北などでターン続行不可能になった
  actions: PlayerActionTag[] = [];
  private mPos: Pos = new Pos(-1, -1); // 現在地(盤外:{-1,-1})
  id: number;
  watched: Set<number>; // 正体確認している？
  won: Set<number>  // 勝利している？
  items: Item[];
  choices: Choice<any>[];
  bomb: number = 2;
  life: number = 3; //残機
  waitCount: number = 0;
  game: Game;
  spellCards: SpellCard[] = [];
  constructor(game: Game, character: Character, name: string, id: number) {
    this.game = game;
    this.character = character;
    this.name = name;
    this.id = id;
    this.watched = new Set<number>();
    this.won = new Set<number>();
    this.isAbleToAction = true;
    this.items = [];
    this.choices = [];
  }

  get characterName() { return this.character.name; }
  get level() {
    let result = this.character.level
    let land = this.currentLand;
    if (!land) return result;
    let up = land.powerUp.levelUp;
    if (!up || up.every(x => x !== this.characterName)) return result;
    return result + 1;
  }
  get mental() {
    let result = this.character.mental;
    let land = this.currentLand;
    if (!land) return result;
    let up = land.powerUp.mentalUp;
    if (!up || up.every(x => x !== this.characterName)) return result;
    return result + 1;
  }
  get pos() { return this.mPos; }
  get race() { return this.character.race; }
  set pos(value: Pos) {
    if (!value.equal(this.mPos)) this.waitCount = 0;
    this.mPos = value;
  }
  get specificAdditionalActions() {
    // ボムチェック？
    return this.character.specificAdditionalActions;
  }
  get fieldActions() {
    // ボムチェック？
    return this.character.fieldActions;
  }
  heal() {
    if (this.isAbleToGetSomething) this.life = Math.min(5, this.life + 1);
  }
  isAbleToGetSomething(): boolean {
    return !this.actions.includes("移動2");
  }
  with(...args: Attribute[]): WithAttribute {
    return new WithAttribute(this, ...args);
  }
  private get currentLand() {
    if (this.pos.isOutOfLand()) return null;
    return this.game.map[this.pos.x][this.pos.y];
  }
  checkResistanceHooks(choices: Choice<any>[], attrs: Attribute[]): Choice<any>[] {
    // キャラとアイテムのHookを確認
    attrs = _.uniq(attrs);
    let result: Choice<any>[] = [];
    let forced: Choice<any>[] = [];
    let applyHook = (hook: ResistanceHook) => {
      for (let when of hook.when) {
        if (typeof (when) === "string") {
          if (!attrs.includes(when)) return;
        } else {
          for (let w of when) if (!attrs.includes(w)) return;
        }
        let choices = hook.choices.bind(this.game)(this, attrs);
        if (hook.force) forced.push(...choices);
        else result.push(...choices);
      }
    }
    let applyHooks = (hooks: ResistanceHook[]) => {
      for (let hook of hooks) applyHook(hook);
    }
    for (let choice of choices) result.push(choice);
    // アイテム / キャラ / 地形 のフックを確認
    for (let item of this.items) applyHooks(item.resistanceHooks);
    applyHooks(this.character.resistanceHooks)
    if (!this.pos.isOutOfLand()) {
      let map = this.game.map[this.pos.x][this.pos.y];
      if (map !== null) applyHooks(map.resistanceHooks);
    }
    if (forced.length > 0) return forced;
    return result;
  }
  get watchedArray(): number[] { return setToArray(this.watched); }
  get wonArray(): number[] { return setToArray(this.won); }
  toString(): string {
    return `${this.name}:
  x: ${this.pos.x} ,y:${this.pos.y}
  ボム: ${this.bomb} , 残機: ${this.life} , 待機: ${this.waitCount}
  キャラ: ${toString(this.character)}
  勝利済み: ${this.won}
  正体確認: ${this.watched}
  アイテム: {${this.items.map(x => x.name).join(",")}}`;
  }
}
