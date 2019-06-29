// プレイヤーに提示する選択肢
export class Choice {
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
export function message(text: string): Choice {
  return new Choice(text, () => { })
}
// 何もせずプレイヤーに提示するだけの選択肢
export function messages(...texts: string[]): Choice[] {
  return texts.map(text => new Choice(text, () => { }));
}
export function choices(message: string, callback: () => any): Choice[] {
  return [new Choice(message, callback)]
}
// プレイヤーに提示すらせず続行するための空の選択肢
export function nop(): Choice[] { return [] }
