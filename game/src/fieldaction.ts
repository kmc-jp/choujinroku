import { Game } from "./game";
import { Player } from "./player";
import { Choice } from "./choice";
// フィールド上で手番を消費して行う行動
export type FieldAction = (this: Game, player: Player) => Choice<any>[];

// 1D <= レベルで縦横で隣接したマスの他者1人の正体がわかる
export function jouhariFieldAction(this: Game, player: Player): Choice<any>[] {
  let name = "浄玻璃の鏡"
  return this.getPlayersNextTo(player.pos)
    .filter(x => !player.watched.has(x.id))
    .map(other => new Choice(`${other.name}に${name}を使用`, () => {
      player.choices = this.getDiceChoices(player, name,
        dice => {
          if (dice <= player.level) this.watch(player, other);
          this.doFieldAction(player);
        })
    }));
}
