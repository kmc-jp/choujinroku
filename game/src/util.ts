export function toString(obj: any): string {
  if (typeof (obj) !== "object") {
    if (typeof (obj) === "function") return "";
    return `${obj}`;
  }
  let result: string[] = []
  for (let key in obj)
    result.push(`${key}:${toString(obj[key])}`);
  return "{" + result.join(",") + "}";
}
