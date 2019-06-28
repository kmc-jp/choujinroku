import { Character } from "./character";
export type PlayerAction = "移動1" | "待機" | "移動2" | "戦闘" | "アイテム"
import { Choice, Attribute, Hook } from "./choice";
import { Item } from "./item";
import { toString } from "./util";
import * as _ from "underscore";
import { Game } from "./game";
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
    return this.player.checkWithAttributes(value, this.attrs);
  }
  with(...attributes: Attribute[]): WithAttribute {
    return new WithAttribute(this.player, ...this.attrs.concat(attributes));
  }
}

export class Player {
  name: string;
  private character: Character;
  isAbleToAction: boolean; // 戦闘敗北などでターン続行不可能になった
  actions: PlayerAction[] = [];
  private mPos = { x: -1, y: -1 }; // 現在地(盤外:{-1,-1})
  id: number;
  watched: Set<number>; // 正体確認している？
  won: Set<number>  // 勝利している？
  items: Item[];
  choices: Choice<any>[];
  bomb: number = 2;
  life: number = 3; //残機
  waitCount: number = 0;
  game: Game;
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
  // レベルが上昇してるかもしれない...
  get level() { return this.character.level; }
  get pos() { return this.mPos; }
  set pos(value: { x: number, y: number }) {
    if (value.x !== this.mPos.x || value.y !== this.mPos.y)
      this.waitCount = 0;
    this.mPos = value;
  }
  isAbleToGetSomething(): boolean {
    return !this.actions.includes("移動2");
  }
  with(...args: Attribute[]): WithAttribute {
    return new WithAttribute(this, ...args);
  }
  checkWithAttributes(choices: Choice<any>[], attrs: Attribute[]): Choice<any>[] {
    // キャラとアイテムのHookを確認
    attrs = _.uniq(attrs);
    let result: Choice<any>[] = [];
    let applyHook = (hook: Hook) => {
      // force
      for (let when of hook.when) {
        if (typeof (when) === "string") {
          if (!attrs.includes(when)) return;
        } else {
          for (let w of when) if (!attrs.includes(w)) return;
        }
        result.push(...hook.choices.bind(this.game)(this));
      }
    }
    for (let choice of choices) result.push(choice);
    for (let item of this.items) {
      for (let hook of item.hooks) applyHook(hook);
    }
    for (let hook of this.character.hooks) applyHook(hook);
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
