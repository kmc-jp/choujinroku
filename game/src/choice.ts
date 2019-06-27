export type ChoiceType = { [key: string]: number | string };
export class Choice<T extends ChoiceType> {
  tag: string;
  elem: T;
  callback: (x: T) => any;
  constructor(tag: string, elem: T, callback: (x: T) => any) {
    this.tag = tag;
    this.elem = elem;
    this.callback = callback;
  }
  invoke() { this.callback(this.elem); }
  toString(): string {
    let result: string[] = [];
    for (let key in this.elem)
      if (key !== "tag") result.push(key + ":" + this.elem[key]);
    return this.tag + ":{" + result.join(",") + "}";
  }
}
