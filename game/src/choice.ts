import { Game } from "./game";
import { Player } from "./player";

export type ChoiceType = { [key: string]: number | string };
// プレイヤーに提示する選択肢
export class Choice<T extends ChoiceType> {
  message: string;
  private callback: () => any;
  constructor(message: string, callback: () => any) {
    this.message = message;
    this.callback = callback;
  }
  wrap(fun: () => any) {
    let original = this.callback;
    this.callback = () => { fun(); original(); };
  }
  invoke() { this.callback(); }
  toString(): string { return this.message; }
}
// 何もせずプレイヤーに提示するだけの選択肢
export function message(text: string): Choice<{}> {
  return new Choice(text, () => { })
}
// プレイヤーに提示すらせず続行するための空の選択肢
export function nop(): Choice<any>[] { return [] }
