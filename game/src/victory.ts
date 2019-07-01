import { LandName } from "./land";
import { Game } from "./game";
import { Player } from "./player";
import { ItemName } from "./item";
import { RoleName, CharaName } from "./character";
import { VictoryHook } from "./hook";

// xxでxxを持ってxxターン待機して勝利
export function waitToWin(where: LandName, items: ItemName[], waitCount: number): VictoryHook {
  return {
    type: "A",
    when: ["待機"],
    hook(this: Game, player: Player) {
      let land = player.currentLand;
      if (land === null) return false;
      if (land.name !== where) return false;
      for (let item of items) {
        if (player.getWaitCount(item) < waitCount) return false;
      }
      return true;
    }
  }
}
// xxで誰かがxxを持ってx人以上集まって勝利
export function gatherToWin(where: LandName, item: ItemName, memberCount: number): VictoryHook {
  return {
    type: "A",
    when: ["移動"],
    allowAisNotMe: true,
    hook(this: Game, _: Player, me: Player) {
      let land = me.currentLand;
      if (land === null) return false;
      if (land.name !== where) return false;
      let heres = this.getPlayersAt(me.pos);
      if (heres.length < memberCount) return false;
      return heres.some(x => x.items.some(i => i.name === item));
    }
  }
}
// 全員の正体を確認し、全ての ignoreCharas を除く Role のキャラクターに戦闘で勝つ
export function allWatchAndAllWinToWin(requireWinRole: RoleName, ignoreCharas: CharaName[]): VictoryHook {
  return {
    type: "AtoB",
    when: ["正体確認", "戦闘勝利"],
    hook(this: Game, player: Player) {
      for (let other of this.getOthers(player)) {
        if (!player.watched.has(other.id)) return false;
        if (other.role !== requireWinRole) continue;
        if (ignoreCharas.includes(other.characterName)) continue;
        if (!player.won.has(other.id)) return false;
      }
      return true;
    }
  }
}
