export type ChoiceType = { [key: string]: number | string };
// export type ChoiceTag = "初期配置位置" | "移動1"
export class Choice {
  tag: string;
  elem: ChoiceType;
  private callback: (x: ChoiceType) => any;
  constructor(tag: string, elem: ChoiceType, callback: (x: ChoiceType) => any) {
    this.tag = tag;
    this.elem = elem;
    this.elem.tag = tag;
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
