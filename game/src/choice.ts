export type ChoiceType = { [key: string]: number | string };
export type UnaryFun<T> = (x: T) => any;
export class Choice<T extends ChoiceType> {
  tag: string;
  elem: T;
  private callback: UnaryFun<T>;
  constructor(tag: string, elem: T, callback: (x: T) => any) {
    this.tag = tag;
    this.elem = elem;
    this.callback = callback;
  }
  wrap(fun: (x: UnaryFun<T>) => UnaryFun<T>) {
    let original = this.callback;
    this.callback = fun(original);
  }
  invoke() { this.callback(this.elem); }
  toString(): string {
    let result: string[] = [];
    for (let key in this.elem)
      if (key !== "tag") result.push(key + ":" + this.elem[key]);
    return this.tag + ":{" + result.join(",") + "}";
  }
}
export function message(text: string): Choice<{}> {
  return new Choice(text, {}, () => { })
}
