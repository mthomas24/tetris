import { BOARD_HEIGHT, BOARD_WIDTH, PREVIEW_COUNT, ROOF, SOFT_DROP_INTERVAL, SQUARE_SIZE, TYPES } from "./data.js";
import { isIntersecting, Piece } from "./pieces.js";
import { Application, Graphics, Loader, Sprite } from "./pixi.mjs";

Loader.shared.add("assets/tiles.json").load(setup);

let game;

function setup() {
  const sheet = Loader.shared.resources["assets/tiles.json"].spritesheet;
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
   * @param {Spritesheet} sheet 
   */
  constructor(sheet) {
    this.sheet = sheet;
    this.queue = [...shuffleArray(TYPES)];
    this.board = new Array(BOARD_HEIGHT).fill(null).map(() => new Array(BOARD_WIDTH).fill(""));
    this.currentPiece = new Piece(this.queue.shift(), this.board);
    console.log(this.currentPiece)
    this.dropInterval = 600;
    this.lockDelay = 1000;
    this.hold = null;
    this.canHold = true;

    this.fallTimer = null;
    // this.softDropFallTimer = null;
    this.softDropKeyDown = false;

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

  getNextPiece() {
    let result = this.queue.shift();
    if (this.queue.length < PREVIEW_COUNT)
      this.queue.push(...shuffleArray(TYPES))
    return result;
  }

  startNextPiece() {
    this.currentPiece = new Piece(this.getNextPiece(), this.board);
    this.canHold = true;
    clearInterval(this.fallTimer);
    this.fallTimer = setInterval(() => this.pieceFall(), this.dropInterval);
  }

  renderBoard() {
    const textureNames = {
      I: "cyan.png",
      O: "yellow.png",
      T: "pink.png",
      J: "purple.png",
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

    let sprites = [];

    for (let r = 0; r < toRender.length; r++) {
      for (let c = 0; c < toRender[r].length; c++) {
        if (!toRender[r][c]) continue;
        let tName = textureNames[toRender[r][c]];
        let s = new Sprite(this.sheet.textures[tName]);
        [s.x, s.y] = [c * SQUARE_SIZE, r * SQUARE_SIZE];
        [s.width, s.height] = [SQUARE_SIZE, SQUARE_SIZE];
        this.app.stage.addChild(s);
        sprites.push(s);
      }
    }

    let hardDropPos = this.currentPiece.getHardDropYPos();
    let texture = this.sheet.textures[textureNames[this.currentPiece.type]];
    // let texture = this.sheet.textures["invis.png"];

    for (let r = 0; r < this.currentPiece.grid.length; r++) {
      for (let c = 0; c < this.currentPiece.grid[r].length; c++) {
        if (!this.currentPiece.grid[r][c]) continue;
        let x = this.currentPiece.pos.x + c;
        let y = ROOF + BOARD_HEIGHT - 1 - hardDropPos + r;
        // if (x < 0 || x >= toRender[0].length || y < 0 || y >= toRender.length) continue;
        let s = new Sprite(texture);
        [s.x, s.y] = [x * SQUARE_SIZE, y * SQUARE_SIZE];
        [s.width, s.height] = [SQUARE_SIZE, SQUARE_SIZE];
        s.alpha = 0.4;
        this.app.stage.addChild(s);
        sprites.push(s);
      }
    }

    return () => sprites.forEach(s => s.destroy());
  }

  pieceFall(fromGravity = true) {
    if (!fromGravity && !this.softDropKeyDown) return;
    if (fromGravity && this.softDropKeyDown) return;

    if (!fromGravity) {
    }

    // console.log(this);
    if (!isIntersecting(this.board, this.currentPiece.grid, this.currentPiece.pos.shifted(0, -1))) {
      this.currentPiece.pos.y--;
      // setTimeout(() => this.pieceFall(), this.dropInterval);
    } else {
      setTimeout(() => {
        if (!isIntersecting(this.board, this.currentPiece.grid, this.currentPiece.pos.shifted(0, -1)))
          return;
        this.currentPiece.place(this.board);
        this.clearRows();
        this.startNextPiece();
      }, this.lockDelay);
    }
  }

  clearRows() {
    this.board = this.board.filter(r => !r.every(c => c));
    while (this.board.length < BOARD_HEIGHT) {
      this.board.unshift(new Array(BOARD_WIDTH).fill(""));
    }
    // console.log(this.board);
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
          if (this.canHold) {
            let tmp = this.hold;
            this.hold = this.currentPiece.type;
            this.currentPiece = new Piece(tmp || this.getNextPiece(), this.board);
            this.canHold = false;
          }
          break;
        }
        case "ArrowDown": {
          // if (!isIntersecting(this.board, this.currentPiece.grid, this.currentPiece.pos.shifted(0, -1)))
          //   this.currentPiece.pos.y--;
          this.softDropKeyDown = true;
          
          break;
        }
        case " ": {
          this.currentPiece.pos.y = this.currentPiece.getHardDropYPos();
          this.currentPiece.place(this.board);
          this.clearRows();
          this.startNextPiece();
          break;
        }
      }
    });

    window.addEventListener("keyup", evt => {
      switch (evt.key) {
        case "ArrowDown": {
          this.softDropKeyDown = false;
        }
      }
    });

    this.fallTimer = setInterval(() => this.pieceFall(), this.dropInterval);
    setInterval(() => this.pieceFall(false), SOFT_DROP_INTERVAL);

    let clearPrev;
    this.app.ticker.add(delta => {
      if (clearPrev) clearPrev();
      clearPrev = this.renderBoard();
    });
  }
}
