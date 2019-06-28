import { Game } from "./game";
import { Player } from "./player";

export type UnaryFun<T> = (x: T) => any;
export type ChoiceType = { [key: string]: number | string };
// プレイヤーに提示する選択肢
export class Choice<T extends ChoiceType> {
  message: string;
  elem: T;
  private callback: UnaryFun<T>;
  constructor(message: string, elem: T, callback: (x: T) => any) {
    this.message = message;
    this.elem = elem;
    this.callback = callback;
  }
  wrap(fun: (x: UnaryFun<T>) => UnaryFun<T>) {
    let original = this.callback;
    this.callback = fun(original);
  }
  invoke() { this.callback(this.elem); }
  toString(): string { return this.message; }
}
// 何もせずプレイヤーに提示するだけの選択肢
export function message(text: string): Choice<{}> {
  return new Choice(text, {}, () => { })
}
// プレイヤーに提示すらせず続行するための空の選択肢
export function nop(): Choice<any>[] { return [] }
