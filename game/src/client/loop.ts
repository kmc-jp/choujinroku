import * as I from "ibukidom";
function helloBox(p: I.Box, store: I.DataStore): I.Box {
  let text = ` hello ibuki.ts !!`.replace(/\n/g, "")
  return new I.FitBox(p, { textAlign: "left", padding: 30 }).tree(p => {
    new I.Text(p, text)
  })
}

function informationBox(p: I.Box, store: I.DataStore): I.Box {
  return new I.FitBox(p, {
    textAlign: "center",
    fontSize: 30,
    padding: 30
  }).tree(p => {
    new I.Text(p, "information box\n")
    // 改行を含めたtoがやばい
    new I.Text(p, store.sec.to(x => `Frame : ${x} `), { color: "#afb" })
    new I.BR(p)
    new I.Text(p, store.pressedKey.to(x => `Key :  ${x} `), { color: "#afb" })
    new I.BR(p)
    new I.Text(p, store.event.to(x => `Mouse : ${x}  `), { color: "#afb" })
    new I.BR(p)
    // new FAIcon(p, "faIgloo", { color: I.Color.parse("#fab") })
    new I.Spinner(p)
    new I.Spinner(p, { type: "grow" })
    new I.Text(p, "\n")
    new I.Text(p, store.pressedKey, { href: store.pressedKey })
  }).on("mouseover", () => { store.event.set("mouseover") })
    .on("mouseout", () => { store.event.set("mouseout") })
    .on("mousemove", () => { store.event.set("mousemove") })
}
function flexBoxInputTest(p: I.Box, store: I.DataStore, colorScheme: I.ColorScheme): I.Box {
  return new I.FlexBox(p, {
    flexDirection: "column",
    alignItems: "flex-start",
    padding: 20,
  }).tree(p => {
    new I.Text(p, "I.Input with flexBox\n", {})
    function create(type: I.InputType, option: I.InputOption) {
      let input = I.toStore("")
      return new I.Input(p, {
        type: type,
        ...option,
        label: input.to(x => type + " -> " + x)
      }, { colorScheme: colorScheme }).assign(input)
    }
    create("text", { placeholder: "reactive input here" }).assign(store.inputted)
    let preLabel = I.toStore("")
    create("text", { prependLabel: preLabel }).assign(preLabel)
    let valid = I.toStore(true)
    create("text", { prependLabel: "size < 4", valid: valid }).value.regist(x => valid.set(x.length < 4))
    create("select", { options: ["ro", "ro", "to", "ro"] })
    create("select", { options: ["ro", "ro", "to", "ro"], multiple: true })
    create("text", { placeholder: "readonly", readonly: true }).assign(store.inputted)
    let inputTypes: I.InputType[] = [
      "password", "color", "range",
      "checkbox", "file", "time",
      "date", "email",
      "search", "tel", "time",
      "url", "radio", "number",
    ]
    for (let s of inputTypes) create(s, {})
    new I.Input(p, { placeholder: "normal text" }, { colorScheme: colorScheme })
    new I.Input(p, { placeholder: "dontFit" }, { colorScheme: colorScheme, dontFitWidth: true })
    new I.Input(p, { placeholder: "dontFit", label: "dontFit" }, { colorScheme: colorScheme, dontFitWidth: true })
  });
}
function flexBoxMediaTest(p: I.Box, store: I.DataStore, colorScheme: I.ColorScheme): I.Box {
  return new I.FlexBox(p, {
    flexDirection: "column",
    alignItems: "flex-start",
    padding: 20,
  }).tree(p => {
    new I.Text(p, store.sec.to(x => `Media With I.FlexBox  : ${x % 100}%`), {})
    new I.ProgressBar(p, store.sec.to(x => Math.floor(x / 50) * 10 % 100), { height: 1, withLabel: false }, 100)
    new I.Text(p, "striped", {})
    new I.ProgressBar(p, store.sec.to(x => Math.floor(x / 50) * 10 % 100), { height: 10, withLabel: false, striped: true }, 100)
    new I.Text(p, "display percentage", {})
    new I.ProgressBar(p, store.sec.to(x => Math.floor(x / 50) * 10 % 100), { height: 20, withLabel: true }, 100)
    new I.Text(p, "custom color", {})
    new I.ProgressBar(p, store.sec.to(x => Math.floor(x / 50) * 10 % 100), { height: 30, withLabel: true, colorScheme, striped: true }, 100)
    new I.HR(p)
    new I.Alert(p).tree(p => {
      new I.Text(p, "current link is ")
      new I.Text(p, store.pressedKey, { href: store.pressedKey })
      new I.Text(p, "!!!")
      new I.HR(p)
      new I.Text(p, "current link is ")
      new I.Text(p, store.pressedKey, { href: store.pressedKey })
      new I.Text(p, "!!!")
    })
  })
}

function tableTest(p: I.Box, store: I.DataStore): I.Box {
  return new I.FlexBox(p, {
    flexDirection: "column",
    alignItems: "flex-start",
    padding: 20,
  }).tree(p => {
    new I.Table(p, {}, (x, y) => {
      if (y % 2 === 0) return { colorScheme: new I.ColorScheme("#cdf", "#222222bb", "#abd") }
      return {}
    }).addContents([
      ["Table", "Test", "I.Box"],
      ["please", "mouse", "hover"],
      [store.event, store.event, store.event],
      [store.event, store.event, store.event],
      [store.event, store.event, store.event],
      [store.event, store.event, store.event],
      [store.event, store.event, store.event],
      [store.event, store.event, store.event],
      [store.event, store.event, store.event],
      [store.event, store.event, store.event],
      [store.event, store.event, store.event],
      [store.event, store.event, store.event],
      [store.event, store.event, store.event],
      [store.event, store.event, store.event],
    ]).on("mouseover", () => { store.event.set("mouseover") })
      .on("mouseout", () => { store.event.set("mouseout") })
      .on("mousemove", () => { store.event.set("mousemove") })
  });
}
function iframeTest(p: I.Box, store: I.DataStore): I.Box {
  return new I.FitBox(p, {
    padding: 20,
  }).tree(p => {
    new I.Text(p, "iframe Test I.Box\n", {})
    new I.IFrame(p, { src: "https://www.openstreetmap.org/export/embed.html", height: p.height * 0.7 })
  });
}
function markdownTest(p: I.Box, colorScheme: I.ColorScheme): I.Box {
  return new I.FitBox(p, {
    padding: 20,
  }).tree(p => {
    let text = new I.Input(p, { type: "textarea", label: "realtime markdown" }, { colorScheme: colorScheme }).value
    // new MarkDown(p, text)
  });
}
function katexTest(p: I.Box, colorScheme: I.ColorScheme): I.Box {
  return new I.FitBox(p, {
    padding: 20,
  }).tree(p => {
    new I.Text(p, "realtime katex")
    let text = new I.Input(p, { type: "textarea" }, { colorScheme: colorScheme }).value
    // new Katex(p, text)
  });
}
function movableBottomTest(p: I.Box, store: I.DataStore, colorScheme: I.ColorScheme): I.Box {
  // TODO: show FPS
  return new I.Box(p, {
    fit: { x: "right", y: "bottom" },
    height: p.height * 0.3,
    width: p.width * 0.45,
    colorScheme: colorScheme,
    padding: 20,
    fontSize: 40,
    border: { width: 5, style: "solid", radius: 15 },
  }).tree(p => {
    new I.Text(p, "クリックすると動き出すやで")
  }).on("click", function () {
    let tr = { duration: 0.5 }
    this
      .to({ fit: { x: "right", y: "center" }, }, tr)
      .next({ fit: { x: "right", y: "top" } }, tr)
      .next({ fit: { x: "center", y: "top" } }, tr)
      .next({ fit: { x: "left", y: "top" } }, tr)
      .next({ fit: { x: "left", y: "center" }, }, tr)
      .next({ fit: { x: "left", y: "bottom" }, }, tr)
      .next({ fit: { x: "center", y: "bottom" } }, tr)
      .next({ fit: { x: "right", y: "bottom" } }, tr)
  }).toRelativeOnHover({ scale: 0.8 })
}
function bottomTest(p: I.Box, store: I.DataStore, colorScheme: I.ColorScheme): I.Box {
  // TODO: show FPS
  let result = new I.Box(p, {
    fit: { x: "left", y: "bottom" },
    height: p.height * 0.3,
    width: p.width * 0.45,
    colorScheme: colorScheme,
    padding: 20,
    fontSize: 40,
    border: { width: 5, style: "solid", radius: 15 },
  }).tree(p => {
    new I.Text(p, "ドラッグできるやで")
  }).onDrag(function (x, y) {
    this.x = x;
    this.y = y;
  })
  return result
}

export function threeBoxSampleScene(scene: I.Scene) {
  let store = {
    inputted: I.toStore(""),
    sec: scene.perFrame(1),
    pressedKey: I.toStore(""),
    event: I.toStore(""),
    posX: I.toStore(0)
  }
  let colorScheme = new I.ColorScheme("#222222bb", "#cdf", "#abd")
  let loopView = new I.ThreeLoopView(scene,
    {
      height: scene.height * 0.7,
      fit: { x: "center", y: "top" },
    }, {
      colorScheme: colorScheme,
      border: { width: 5, style: "solid", radius: 15 },
      fontFamily: "Menlo",
    }).add([
      p => helloBox(p, store),
      p => informationBox(p, store),
      p => flexBoxInputTest(p, store, colorScheme),
      p => flexBoxMediaTest(p, store, new I.ColorScheme("#222222bb", "#abd", "#238")),
      p => markdownTest(p, colorScheme),
      p => katexTest(p, colorScheme),
      p => tableTest(p, store),
      p => iframeTest(p, store),

    ])
  movableBottomTest(scene, store, colorScheme)
  bottomTest(scene, store, colorScheme)
  let wait = 0
  scene.update(() => { wait--; })
  scene.on("keydownall", key => {
    if (!key) return;
    let last = ""
    for (let k in key) last = k
    if (last !== "") store.pressedKey.set(last)
    if (!key) return;
    if (key.Escape) {
      scene.destroy();
      scene.gotoNextScene(threeBoxSampleScene)
      return;
    }
    if (wait > 0) return;
    if (key.ArrowLeft) {
      store.posX.set((x: number) => x + 1)
      loopView.turn(1)
      wait = 20
    } else if (key.ArrowRight) {
      store.posX.set((x: number) => x - 1)
      loopView.turn(-1)
      wait = 20
    }
  })
}

// try
// new World().play(scene => threeBoxSampleScene(scene))
