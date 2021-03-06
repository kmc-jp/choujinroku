import { LandName, Land } from "./land";
import { Game } from "./game";
import { Player } from "./player";
import { ItemName } from "./item";
import { RoleName, CharaName } from "./character";
import { VictoryHook, NPCType } from "./hooktype";
import { SpellCard } from "./spellcard";

// 条件を満たしてxxでNターン待機
export function waitToWinWith(when: (p: Player) => boolean): VictoryHook {
  return {
    type: "A",
    when: ["手番開始"],
    hook(player: Player) { return when(player) }
  }
}

// xxでxxを持ってxxターン待機して勝利
export function waitToWin(where: LandName, items: ItemName[], waitCount: number, when?: (p: Player) => boolean): VictoryHook {
  return {
    type: "A",
    when: ["手番開始"],
    hook(player: Player) {
      let land = player.currentLand;
      if (land === null) return false;
      if (land.name !== where) return false;
      for (let item of items) {
        if (player.getWaitCount(item) < waitCount) return false;
      }
      if (when && !when(player)) return false;
      return true;
    }
  }
}

//xxがxxを持ってxxに入る 幽々子のせいでキャラ名を指定している 
export function enterToWin(where: LandName, items: ItemName[], charas: CharaName[]): VictoryHook{
    return {
      type: "A",
      when: ["移動"],
      allowAisNotMe: true,
      hook(player: Player, me: Player){
        let land = player.currentLand;
        if (land === null) return false;
        if (land.name !== where) return false;
        if(!charas.some(chara=> chara === player.characterName)) return false;
        for(let item of items){
          if(!player.items.some(i => i.name === item)) return false;
        }
        return true;
      }
    }
}

//条件を満たした状態でxxに入る
export function enterToWinWith(when: (p: Player)=>boolean, where?: LandName): VictoryHook{
  return {
    type: "A",
    when: ["移動"],
    hook(player: Player, me: Player){
      if(where){
        let land = player.currentLand;
        if (land === null) return false;
        if (land.name !== where) return false;
      }
      return when(me);
    }
  }
}


// xxで誰かがxxを持ってx人以上集まって勝利
// TODO: 移動以外でもフックする必要がある
export function gatherToWin(where: LandName, item: ItemName, memberCount: number): VictoryHook {
  return {
    type: "A",
    when: ["移動"],
    allowAisNotMe: true,
    hook(player: Player, me: Player) {
      let land = me.currentLand;
      if (land === null) return false;
      if (land.name !== where) return false;
      let heres = me.game.getPlayersAt(me.pos);
      if (heres.length < memberCount) return false;
      return heres.some(x => x.items.some(i => i.name === item));
    }
  }
}

// 場にいる全員が集まったら勝利 
// TODO: 移動以外でもフックする必要がある
export function allGatherToWin(): VictoryHook{
  return {
    type: "A",
    when: ["移動"],
    allowAisNotMe: true,
    hook(player: Player, me: Player) {
      let land = me.currentLand;
      if (land === null) return false;
      let heres = me.game.getPlayersAt(me.pos);
      let filedInsiders = me.game.players.filter(player => player.currentLand != null)
      return heres.length === filedInsiders.length;
    }
  }
}

// 全員の正体を確認し、全ての ignoreCharas を除く Role のキャラクターに戦闘で勝つ
export function allWatchAndAllWinToWin(winRequire: (a: Player) => boolean): VictoryHook[] {
  function impl(player: Player) {
    for (let other of player.game.getOthers(player)) {
      if (!player.watched.has(other.id)) return false;
      if (winRequire(other) && !player.won.has(other.id)) return false;
    }
    return true;
  }
  return [{
    type: "AtoB",
    when: ["正体確認"],
    hook: impl
  }, {
    type: "AwinB",
    when: ["AwinB"],
    hook: impl
  }]
}

// 特定のアイテムを所持、かつ、全ての ignoreCharas を除く Role のキャラクターに戦闘で勝つ
export function haveItemAndAllWinToWin(item: ItemName, winRequire: (a: Player) => boolean): VictoryHook[] {
  function impl(player: Player) {
    if(!player.items.some(i=>i.name === item)) return false;
    for (let other of player.game.getOthers(player)) {
      if (winRequire(other) && !player.won.has(other.id)) return false;
    }
    return true;
  }
  return [{
    type: "A",
    when: ["アイテム獲得"],
    hook: impl
  }, {
    type: "AwinB",
    when: ["AwinB"],
    hook: impl
  }]
}

// 全員の正体を確認し、全ての ignoreCharas を除く Role のキャラクターに戦闘で勝つ
export function winToWin(when: (me: Player, b: Player, c: SpellCard) => boolean): VictoryHook {
  return {
    type: "AwinB",
    when: ["AwinB"],
    hook(a: Player, b: Player | NPCType, spellCard: SpellCard, me?: Player) {
      if (!(b instanceof Player)) return false;
      return when(a, b, spellCard);
    }
  }
}

// 満身創痍にする
export function killToWin(when: (me: Player, target: Player) => boolean): VictoryHook {
  return {
    type: "AbyB",
    when: ["満身創痍"],
    allowAisNotMe: true,
    hook(a: Player, b?: Player, me?: Player): boolean {
      if (!b) return false;
      if (!me) return false;
      if (b.id !== me.id) return false;
      return when(me, a)
    }
  }
}

export function loseToLose(when: (me: Player, target: Player) => boolean): VictoryHook {
  return {
    type: "AwinB", when: ["AwinB"], allowAisNotMe: true,
    hook(a: Player, b: Player | NPCType, spellCard: SpellCard, me?: Player): boolean {
      if (!(b instanceof Player)) return false;
      if (!me) return false;
      if (b.id !== me.id) return false;
      return when(me, a)
    }
  }
};

export function damagedToLose(when: (me: Player, target?: Player) => boolean): VictoryHook {
  return {
    type: "AbyB", when: ["残機減少"],
    hook(a: Player, b?: Player, me?: Player): boolean {
      return when(a, b)
    }
  };
}

export function destroyedToLose(lands: LandName[]): VictoryHook {
  return {
    type: "ALand", when: ["地形破壊"], allowAisNotMe: true,
    hook(a: Player, land: Land): boolean {
      return lands.some(x => x === land.name)
    }
  };
}

export const destroyedToWin = destroyedToLose

export function watchedToLose(when: (me: Player, from: Player) => boolean): VictoryHook {
  return {
    type: "AtoB",
    allowAisNotMe: true,
    when: ["正体確認"],
    hook(a: Player, b: Player, me: Player): boolean {
      if (b.id !== me.id) return false;
      return when(me, a)
    }
  }
}
