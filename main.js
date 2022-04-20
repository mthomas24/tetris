import { BOARD_HEIGHT, BOARD_WIDTH, PREVIEW_COUNT, ROOF, SQUARE_SIZE, TYPES } from "./data.js";
import { isIntersecting, Piece } from "./pieces.js";
import { Application, Graphics, Loader, Sprite } from "./pixi.mjs";

Loader.shared.add("assets/tiledata.json").load(setup);

let game;

function setup() {
  const sheet = Loader.shared.resources["assets/tiledata.json"].spritesheet;
  // console.log(textures);
  console.log(sheet);
  game = new Game(sheet);
  game.start();
}

function shuffleArray(arr) {
  let array = [...arr];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

class Game {
  /**
   * 
   * @param {Spritesheet} sheet 
   */
  constructor(sheet) {
    this.sheet = sheet;
    this.queue = ["I", ...shuffleArray(TYPES)];
    this.board = new Array(BOARD_HEIGHT).fill(null).map(() => new Array(BOARD_WIDTH).fill(""));
    this.currentPiece = new Piece(this.queue.shift(), this.board);
    console.log(this.currentPiece)
    this.board[19][9] = "L";
    this.dropInterval = 600;
    // this.lockDelay = 1000;
    this.hold = null;
    this.canHold = true;

    this.app = new Application({
      width: BOARD_WIDTH * SQUARE_SIZE,
      height: (BOARD_HEIGHT + ROOF) * SQUARE_SIZE
    });
    this.app.view.setAttribute("id", "board");
    document.body.appendChild(this.app.view);

    let lines = new Graphics();
    lines.beginFill(0x2e2e2e);
    for (let i = 1; i < BOARD_WIDTH; i++) {
      lines.drawRect(
        i * SQUARE_SIZE,
        ROOF * SQUARE_SIZE,
        1,
        this.app.view.height - ROOF * SQUARE_SIZE
      );
    }
    for (let i = ROOF; i < BOARD_HEIGHT + ROOF; i++) {
      lines.drawRect(0, i * SQUARE_SIZE, this.app.view.width, 1);
    }
    lines.endFill();
    this.app.stage.addChild(lines);
  }

  nextPiece() {
    let result = this.queue.shift();
    if (this.queue.length < PREVIEW_COUNT)
      this.queue.push(...shuffleArray(TYPES))
    return result;
  }

  renderBoard() {
    // const colors = {
    //   I: "618477",
    //   O: "7a51c6",
    //   T: "d757a2",
    //   J: "c1d114",
    //   L: "cec621",
    //   S: "29a51b",
    //   Z: "ba2219"
    // }
    const textureNames = {
      I: "cyan.png",
      O: "yellow.png",
      T: "purple.png",
      J: "blue.png",
      L: "orange.png",
      S: "green.png",
      Z: "red.png"
    }
  
    // console.log(currentPiece)
    let toRender = new Array(ROOF).fill(null).map(() => new Array(BOARD_WIDTH).fill(""));
    for (const row of this.board) {
      toRender.push([...row]);
    }
    for (let r = 0; r < this.currentPiece.grid.length; r++) {
      for (let c = 0; c < this.currentPiece.grid[r].length; c++) {
        if (!this.currentPiece.grid[r][c]) continue;
        let x = this.currentPiece.pos.x + c;
        let y = ROOF + BOARD_HEIGHT - 1 - this.currentPiece.pos.y + r;
        if (x < 0 || x >= toRender[0].length || y < 0 || y >= toRender.length) continue;
        toRender[y][x] = this.currentPiece.type;
      }
    }
    // console.log(toRender);
  
    // let g = new Graphics();
    // for (let r = 0; r < toRender.length; r++) {
    //   for (let c = 0; c < toRender[r].length; c++) {
    //     if (!toRender[r][c]) continue;
    //     // console.log(toRender[r][c])
    //     g.beginFill(parseInt(`0x${colors[toRender[r][c]]}`));
    //     g.drawRect(c * SQUARE_SIZE, r * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
    //     g.endFill();
    //   }
    // }
    // this.app.stage.addChild(g);
    // return g;

    let sprites = [];
    // console.log(this.sheet)

    for (let r = 0; r < toRender.length; r++) {
      for (let c = 0; c < toRender[r].length; c++) {
        if (!toRender[r][c]) continue;
        let tName = textureNames[toRender[r][c]];
        console.log(this.sheet.textures[tName]);
        let s = Sprite(this.sheet.textures[tName]);
      }
    }
  }

  pieceFall() {
    
    // console.log(this);
    if (!isIntersecting(this.board, this.currentPiece.grid, this.currentPiece.pos.shifted(0, -1))) {
      this.currentPiece.pos.y--;
      setTimeout(() => this.pieceFall(), this.dropInterval);
    } else {
      // setTimeout(() => {
      this.currentPiece.place(this.board);
      this.currentPiece = new Piece(this.nextPiece(), this.board);
      setTimeout(() => this.pieceFall(), this.dropInterval);
      // }, lockDelay);
    }
  }

  start() {
    console.log(this)
    window.addEventListener("keydown", evt => {
      switch (evt.key) {
        case "ArrowLeft": {
          if (!isIntersecting(this.board, this.currentPiece.grid, this.currentPiece.pos.shifted(-1, 0)))
            this.currentPiece.pos.x--;
          break;
        }
        case "ArrowRight": {
          if (!isIntersecting(this.board, this.currentPiece.grid, this.currentPiece.pos.shifted(1, 0)))
            this.currentPiece.pos.x++;
          break;
        }
        case "ArrowUp": {
          this.currentPiece.rotateClockwise();
          break;
        }
        case "Shift": {
          if (canHold) {
            let tmp = hold;
            hold = this.currentPiece.type;
            this.currentPiece = new Piece(tmp || this.nextPiece(), this.board);
            canHold = false;
          }
          break;
        }
        case "ArrowDown": {
          if (!isIntersecting(this.board, this.currentPiece.grid, this.currentPiece.pos.shifted(0, -1)))
            this.currentPiece.pos.y--;
          break;
        }
      }
    });

    setTimeout(() => this.pieceFall(), this.dropInterval);

    let clearPrev;
    this.app.ticker.add(delta => {
      if (clearPrev) clearPrev();
      prevG = this.renderBoard();
    });
  }
}
