import * as I from "ibukidom";
import { GameProxy } from "../gameproxy";
import * as _ from "underscore";
import "bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import { random } from "../util";
import { Pos } from "../pos";
import { ColorScheme } from "ibukidom";
// クソ適当でやばい
// BootStrap と Bulma に依存してるのが意味不明
// マジックナンバー多すぎ
// 細かく変更するの面倒臭すぎ
// あとでやる
// エンターキーで自動モードってなんやねん
let playerNumber = 6;
let gameProxy = GameProxy.tryToStart(_.shuffle<number>(_.range(GameProxy.getAvailableCharacters().length)).slice(0, playerNumber));
function playerColor(i: number): string { return `hsla(${Math.floor((i * 360) / playerNumber)},100%,82%,0.5)`; }
// マップに全文表示
// 人を色付きで表示
// ログ表示


class ChoujinrokuView {
  scene: I.Scene
  backGround: I.Box;
  mapBox: I.Box[][] = [];
  mapTexts: I.Store<string>[][];
  // ---
  logBox: I.Box;
  logMessage = I.toStore("エンターキーでオートモード");
  // ---
  infoBox: I.Box;
  infoMessage = I.toStore("");
  // ---
  noticeBox: I.Box;
  noticeMessage = I.toStore("");
  height: number;
  width: number;
  choicesBox: I.Box;
  inputMessage = I.toStore("");
  initBackGround(): I.Box {
    return new I.Box(this.scene, {
      colorScheme: "#fff",
      fit: { x: "center", y: "center" }
    })
  }
  initMap(): I.Box[][] {
    let width = this.height * 0.1;
    let height = this.height * 0.13;
    return _.range(6).map(x => _.range(6).map(y =>
      new I.Box(this.backGround, {
        height: height,
        width: width,
        x: width * x * 1.1 + width * 0.8,
        y: height * y * 1.1 + height * 1.4,
        padding: 5,
        fontSize: 16,
        scale: 0,
        border: { width: 1, style: "solid", radius: 3 },
        // isScrollable: true,
      }).tree(p => {
        new I.Text(p, this.mapTexts[x][y])
      }).toRelativeOnHover({ scale: 1.03 }).on("click", () => {
        if (!gameProxy) return;
        let info = gameProxy.getMapInfo(x, y);
        if (info) this.infoMessage.set(info)
      })
      // .onDrag(function (x, y) {
      //   this.x = x;
      //   this.y = y;
      // })
    ))
  }
  initLogBox(): I.Box {
    return new I.Box(this.backGround, {
      height: this.height * 0.9,
      width: this.width * 0.27,
      x: this.width * 0.85,
      y: this.height * 0.5,
      colorScheme: new I.ColorScheme("#eeeeeebb", "#234", "#bcd"),
      padding: 5,
      fontSize: 15,
      fontFamily: "Menlo",
      border: { width: 1, style: "solid", radius: 3 },
      isScrollable: true
    }).tree(p => {
      new I.Text(p, this.logMessage)
    })
  }
  initNoticeBox(): I.Box {
    return new I.Box(this.backGround, {
      height: this.height * 0.06,
      width: this.width * 0.4,
      x: this.width * 0.21,
      y: this.height * 0.06,
      colorScheme: new I.ColorScheme("#eeeeeebb", "#234", "#bcd"),
      padding: 5,
      fontSize: 15,
      fontFamily: "Menlo",
      border: { width: 1, style: "solid", radius: 3 },
      isScrollable: true
    }).tree(p => {
      new I.Text(p, this.noticeMessage)
    })
  }
  initInfoBox(): I.Box {
    return new I.Box(this.backGround, {
      height: this.height * 0.4,
      width: this.width * 0.3,
      x: this.width * 0.55,
      y: this.height * 0.32,
      colorScheme: new I.ColorScheme("#eeeeeebb", "#234", "#bcd"),
      padding: 5,
      fontSize: 15,
      border: { width: 1, style: "solid", radius: 3 },
      fontFamily: "monospace",
      isScrollable: true
    }).tree(p => {
      new I.Text(p, this.infoMessage)
    })
  }
  initChoicesBox(): I.FlexBox {
    let result = new I.FlexBox(this.backGround, {
      height: this.height * 0.4,
      width: this.width * 0.3,
      flexDirection: "column",
      alignItems: "flex-start",
      colorScheme: new I.ColorScheme("#ffffffff", "#fff", "#fff"),
      padding: 5,
      fontSize: 15,
      border: { width: 1, style: "solid", radius: 3 },
      isScrollable: true
    });
    result.x = this.width * 0.55
    result.y = this.height * 0.75
    return result;
  }
  players: I.Box[] = [];
  randoms = _.range(playerNumber).map(x => Math.random() - 0.5)
  updatePlayers(poses: Pos[]) {
    let width = this.height * 0.1;
    let height = this.height * 0.13;
    poses.forEach((pos, i) => {
      if (pos.x < 0) pos.x = 3;
      this.players[i].to({
        x: width * pos.x * 1.1 + width * 0.8 + this.randoms[i] * width / 2,
        y: height * pos.y * 1.1 + height * 1.4 + this.randoms[i] * width / 2
      }, { duration: 0.5, })
    })
  }
  initPlayers() {
    let width = this.height * 0.1;
    let height = this.height * 0.11;
    this.players = _.range(playerNumber).map((x, i) =>
      new I.Box(this.backGround, {
        width: width * 0.8,
        height: height * 0.8,
        colorScheme: new I.ColorScheme(playerColor(i), "#000", "#444"),
        padding: 5,
        fontSize: 30,
        border: { width: 4, style: "solid", radius: 3 },
      }
      ).tree(p => {
        new I.Text(p, `${i + 1}P`)
      }).repeatRelativeOnHover({ scale: 1.03 }).on("mouseover", () => {
        if (gameProxy) this.infoMessage.set(gameProxy.showPlayer(i))
      }))
    this.updatePlayers(_.range(playerNumber).map(x => new Pos(-1, -1)))
  }
  choices: I.Text[] = [];
  updateChoices(choiceMat: string[][]) {
    this.choicesBox.children.forEach(x => x.$dom.remove())
    this.choicesBox.children.splice(0);
    let choices: string[] = [];
    let toPlayerId: number[] = [];
    let toChoiceId: number[] = [];
    choiceMat.forEach((cm, i) => {
      cm.forEach((c, j) => {
        choices.push(`${i + 1}P: ${c}`);
        toPlayerId.push(i);
        toChoiceId.push(j);
        if (gameProxy) this.infoMessage.set(gameProxy.showPlayer(i));
      });
    });
    let makeChoice = (x: string, i: number) => {
      new I.Text(this.choicesBox, x, {
        padding: 5,
        margin: 5,
        border: { width: 1, style: "solid", radius: 3 },
        colorScheme: new I.ColorScheme(playerColor(toPlayerId[i]), "#000", "#bcd"),
      }).on("click", () => {
        this.decide(i);
      }).on("mouseover", function () {
        this.$dom.style.cursor = "pointer"
      }).on("mouseout", function () {
        this.$dom.style.cursor = "default"
      })
    }
    // if (choices.length > 1) makeChoice("ランダム", random(choices.length));
    choices.forEach(makeChoice);
    this.toPlayerId = toPlayerId;
    this.toChoiceId = toChoiceId;
  }
  toPlayerId: number[] = [];
  toChoiceId: number[] = [];
  decide(i: number) {
    if (!gameProxy) return;
    gameProxy.decide(this.toPlayerId[i], this.toChoiceId[i]);
    this.update();
  }
  update() {
    if (!gameProxy) return;
    this.logMessage.set(gameProxy.getLog().join("\n"));
    this.updateChoices(gameProxy.getChoices());
    let map = gameProxy.getMap();
    _.range(6).map(x => _.range(6).map(y => {
      let m = map[x][y]
      this.mapTexts[x][y].set(m.name);
      if (!m.name) {
        this.mapBox[x][y].to({ scale: 0 }, { duration: 0.5 });
      } else {
        this.mapBox[x][y].to({ scale: 1 }, { duration: 0.5 });
      }
      let color = new ColorScheme("#f8f8f8", "#234", "#bcd");
      if (m.attrs.includes("紅マス")) color = new ColorScheme("#fdd", "#234", "#bcd");
      if (m.attrs.includes("花マス")) color = new ColorScheme("#fee", "#234", "#bcd");
      if (m.attrs.includes("水マス")) color = new ColorScheme("#ddf", "#234", "#bcd");
      if (m.attrs.includes("森マス")) color = new ColorScheme("#dfd", "#234", "#bcd");
      if (m.attrs.includes("地マス")) color = new ColorScheme("#ffd", "#234", "#bcd");
      this.mapBox[x][y].colorScheme = color;
      this.mapBox[x][y].to({
        border: { width: m.item ? 5 : 1, style: "solid", radius: 3 },
      }, { duration: 0.5 });
    }));
    this.updatePlayers(gameProxy.getPlayersPos());
    this.decidedTimeCount = 0;
  }
  initInputBox() {
    return new I.Box(this.backGround, {
      height: this.height * 0.06,
      width: this.width * 0.2,
      x: this.width * 0.55,
      y: this.height * 0.06,
      colorScheme: new I.ColorScheme("#eeeeeebb", "#234", "#bcd"),
      padding: 5,
      fontSize: 15,
      fontFamily: "Menlo",
      border: { width: 1, style: "solid", radius: 3 },
      isScrollable: true
    }).tree(p => {
      this.inputMessage =
        new I.Input(p, {
          placeholder: "霊夢 咲夜 アリス",
          value: "",
        }).value;
      this.inputMessage.regist(x => {
        let tmp = GameProxy.tryToStartByNames(x)
        if (!tmp) return;
        gameProxy = tmp;
        playerNumber = gameProxy.getPlayerNumber();
        this.players.forEach(p => p.hidden())
        this.initPlayers();
      })
    })
  }
  randomToggle = 0;
  decidedTimeCount = 0;
  constructor(scene: I.Scene) {
    this.scene = scene;
    this.width = scene.width;
    this.height = scene.height;
    this.backGround = this.initBackGround();
    this.mapTexts = _.range(6).map(x => _.range(6).map(y => I.toStore("???")))
    this.noticeBox = this.initNoticeBox();
    this.mapBox = this.initMap();
    this.logBox = this.initLogBox();
    this.infoBox = this.initInfoBox();
    this.choicesBox = this.initChoicesBox();
    this.initPlayers();
    this.initInputBox();
    scene.update(() => {
      if (!gameProxy) return;
      this.decidedTimeCount++;
      if ((this.randomToggle === 1)
        || (this.randomToggle === 2 && this.decidedTimeCount > 45)
        || this.decidedTimeCount > 45 && this.toChoiceId.length === 1) {
        gameProxy.decideAll();
        this.update();
      }
    })
    scene.on("keypressall", key => {
      if (!key) return;
      if (key[" "]) this.randomToggle = (this.randomToggle + 1) % 3;
      if (key["Enter"] && gameProxy) {
        gameProxy.decideAll();
        this.update();
      }
    })
    this.update();
    this.noticeMessage.set("エンターキーで1手ランダム\nプレイヤーをマウスオーバーで詳細表示\nスペースキーでオートモード切り替え\n開いている地形カードをクリックで詳細表示\nプレイヤーは2~6人ランダムで、キャラもランダム。右の入力欄にキャラ名をスペース区切りで入力するとそのキャラ達でプレイ".replace("\n", " "))
  }
}
new I.World().play(scene => {
  new ChoujinrokuView(scene);
})
