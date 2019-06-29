// プレイヤーに提示する選択肢
export class Choice {
  message: string;
  private callback: () => any;
  constructor(message: string, callback?: () => any) {
    this.message = message;
    if (callback) this.callback = callback;
    else this.callback = () => { };
  }
  wrap(fun: () => any) {
    let original = this.callback;
    this.callback = () => { fun(); original(); };
  }
  invoke() { this.callback(); }
  toString(): string { return this.message; }
}
export function choices(message: string, callback?: () => any): Choice[] {
  if (callback) return [new Choice(message, callback)]
  return [new Choice(message, () => { })]
}
// プレイヤーに提示すらせず続行するための空の選択肢
export function nop(): Choice[] { return [] }
