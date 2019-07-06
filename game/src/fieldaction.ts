import { Game } from "./game";
import { Player } from "./player";
import { Choice, choices } from "./choice";
import { Item, ItemName } from "./item";
// フィールド上で手番を消費して行う行動
export type FieldAction = (this: Game, player: Player) => Choice[];

function getItem(player: Player, itemName: ItemName): Item | null {
  let items = player.items.filter(x => x.name === itemName);
  if (items.length > 0) return items[0];
  return null;
}
function use(player: Player, itemName: ItemName) {
  let item = getItem(player, itemName);
  if (item) player.game.sendBackItem(player, item);
}

// 1D <= レベルで縦横で隣接したマスの他者1人の正体がわかる
export function jouhariAction(this: Game, player: Player): Choice[] {
  return this.getPlayersNextTo(player.pos)
    .filter(x => !player.watched.has(x.id))
    .map(other => new Choice(`${other.name}に浄玻璃の鏡を使用。1D <= レベルで正体がわかる`, () => {
      player.choices = this.getDiceChoices(player, name,
        dice => {
          if (dice <= player.level) this.watch(player, other);
          this.doFieldAction(player);
        })
    }));
}
// 残機が1増える
export function oneUpMashRoomAction(this: Game, player: Player): Choice[] {
  // NOTE: 残機が最大でも使えるんじゃない？？
  return choices("1up茸を食べて残機+1", () => {
    use(player, "1up茸");
    player.heal();
  })
}
// 残機が1減る
export function poisonMashRoomAction(this: Game, player: Player): Choice[] {
  return choices("毒茸を食べて残機を減らす", () => {
    use(player, "毒茸");
    // 耐性持ちには効果が変わる
    player.with("毒茸").choices = choices("毒茸を食べた！", () => {
      this.damaged(player);
    })
  })
}

// 五寸釘+藁人形(藁人形の方には実装しないのが大事)
export function gosunkugiAction(this: Game, player: Player): Choice[] {
  let as = player.items.filter(x => x.name === "五寸釘");
  let bs = player.items.filter(x => x.name === "藁人形");
  if (as.length === 0 || bs.length === 0) return []
  return choices("五寸釘+藁人形で相手を呪って残機を減らす！", () => {
    this.sendBackItem(player, as[0]);
    this.sendBackItem(player, bs[0]);
    player.choices = this.getOthers(player).map(other =>
      new Choice(`${other.name}を呪う！`, () => {
        other.with("呪い", "残機減少").choices = choices(`${player.name}に呪われて残機が減った！ `, () => {
          this.damaged(other, player);
        })
      }))
  })
}
