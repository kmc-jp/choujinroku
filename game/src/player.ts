import { Character } from "./character";
export type PlayerActionTag = "移動1" | "待機" | "移動2" | "戦闘" | "アイテム" | "特殊能力の使用"
import { Choice } from "./choice";
import { Attribute, AttributeHook, WithAttribute } from "./hook";
import { Item, ItemName, Friend } from "./item";
import { toString } from "./util";
import * as _ from "underscore";
import { Game } from "./game";
import { Pos } from "./pos";
import { SpellCard, parseSpellCard } from "./spellcard";
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
  choices: Choice[];
  friend: Friend | null = null;
  bomb: number = 2;
  life: number = 3; //残機
  waitCount: number = 0;
  private waitCountIndexedByItem: { [key: string]: number } = {}
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
  swapPosition(target: Player) {
    // WARN: 移動Hookが発動する？
    let tmp = this.pos;
    this.pos = target.pos;
    target.pos = tmp;
    if (this.pos.isOutOfLand()) this.isAbleToAction = false;
    if (target.pos.isOutOfLand()) target.isAbleToAction = false;
  }
  swapItem(target: Player, playerItemIndex: number, targetItemIndex: number) {
    if (playerItemIndex < 0 || playerItemIndex >= this.items.length) return;
    if (targetItemIndex < 0 || targetItemIndex >= target.items.length) return;
    let item = this.items.splice(playerItemIndex, 1)[0];
    let titem = target.items.splice(targetItemIndex, 1)[0];
    this.game.gainItem(this, titem, false);
    this.game.gainItem(target, item, false);
  }
  swapRandomCharacter() {
    let character = this.game.leftCharacters.pop();
    if (!character) {
      this.game.leftCharacters.push(...this.game.usedCharacters);
      this.game.usedCharacters = [];
      character = this.game.leftCharacters.pop();
    }
    if (!character) return;
    this.swapCharacter(character);
  }
  swapCharacter(character: Character, lostFriend = true) {
    this.game.usedCharacters.push(this.character);
    this.character = character;
    if (this.friend && lostFriend) {
      this.game.leftFriends.push(this.friend);
      this.friend = null;
    }
    this.watched = new Set();
    this.won = new Set();
    // これは残機減少ではない！
    this.life = 3;
    this.bomb = 2;
    this.game.getOthers(this).forEach(other => {
      other.watched.delete(this.id);
      other.won.delete(this.id);
    })
  }
  swapCharacterWithAnotherPlayer(target: Player) {
    let a = this.character;
    let b = target.character;
    this.swapCharacter(b, false);
    target.swapCharacter(a, false);
    // 使用済みの中に分裂して入ってるので戻す
    this.game.usedCharacters = this.game.usedCharacters.filter(
      x => x.id !== a.id && x.id !== b.id);
  }
  getWaitCount(key: ItemName) { return this.waitCountIndexedByItem[key] || 0; }
  get pos() { return this.mPos; }
  get race() { return this.character.race; }
  get role() { return this.character.role; }
  set pos(value: Pos) {
    if (!value.equal(this.mPos)) {
      this.waitCount = 0;
      this.waitCountIndexedByItem = {};
    }
    this.mPos = value;
  }
  get specificActions() {
    // ボムチェック？
    return this.character.specificActions;
  }
  get fieldActions() {
    // ボムチェック？
    return this.character.fieldActions;
  }
  heal() {
    if (this.isAbleToGetSomething) this.life = Math.min(5, this.life + 1);
  }
  healBomb() {
    if (this.isAbleToGetSomething) this.bomb = Math.min(5, this.bomb + 1);
  }

  isAbleToGetSomething(): boolean {
    return !this.actions.includes("移動2");
  }
  with(...args: Attribute[]): WithAttribute {
    return new WithAttribute(this, ...args);
  }
  addWaitCount() {
    this.waitCount++;
    for (let item of this.items) {
      this.waitCountIndexedByItem[item.name] =
        (this.waitCountIndexedByItem[item.name] || 0) + 1
    }
  }
  get currentLand() {
    if (this.pos.isOutOfLand()) return null;
    return this.game.map[this.pos.x][this.pos.y];
  }
  checkAttributeHooks(choices: Choice[], attrs: Attribute[]): Choice[] {
    // TODO: ダイスロールに成功したら、が未実装
    // キャラとアイテムのHookを確認
    attrs = _.uniq(attrs);
    let result: Choice[] = [];
    let forced: Choice[] = [];
    let applyHook = (hook: AttributeHook) => {
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
    let applyHooks = (hooks: AttributeHook[]) => {
      for (let hook of hooks) applyHook(hook);
    }
    for (let choice of choices) result.push(choice);
    // アイテム / キャラ / 地形 のフックを確認
    for (let item of this.items) applyHooks(item.attributeHooks);
    applyHooks(this.character.attributeHooks)
    let map = this.currentLand;
    if (map !== null) applyHooks(map.attributeHooks);
    if (forced.length > 0) return forced;
    return result;
  }
  get watchedArray(): number[] { return setToArray(this.watched); }
  get wonArray(): number[] { return setToArray(this.won); }
  parceCharacter(): string {
    let chara = this.character;
    return `${chara.name}:${chara.level},${chara.mental}(${chara.role})`;
  }
  toString(): string {
    let land = this.currentLand
    let friend = this.friend;
    return `${this.name}:
  ${this.parceCharacter()}
  x:${this.pos.x},y:${this.pos.y}(${land ? land.name : "盤外"})
  ボム:${this.bomb} ,残機:${this.life} ,待機:${this.waitCount}
  勝利済み:${this.wonArray.map(x => this.game.players[x].name).join(",")}
  正体確認:${this.watchedArray.map(x => this.game.players[x].name).join(",")}
  アイテム:{${this.items.map(x => x.name).join(",")}}
  仲間:${friend ? friend.name : ""}
  スペルカード:\n  ${this.spellCards.map(x => parseSpellCard(x)).join("\n  ")}`;
  }
}
