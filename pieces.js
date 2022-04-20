import { BOARD_HEIGHT, BOARD_WIDTH, PIECES, TYPES } from "./data.js";

/**
 * @param {any[][]} array 
 */
function rotateArrayClockwise(array) {
  let result = array.map(r => r.map(c => null));
  for (let r = 0; r < array.length; r++) {
    for (let c = 0; c < array[r].length; c++) {
      result[c][array[r].length - r - 1] = array[r][c];
    }
  }
  return result;
}

export class Vec2 {
  /**
   * @param {number} x
   * @param {number} y
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  shifted(x, y) {
    return new Vec2(this.x + x, this.y + y);
  }
}

export class Piece {
  /**
   * @param {keyof PIECES} type
   */
  constructor(type, board) {
    this.type = type;
    this.grid = PIECES[type];
    this.rotation = 0; // 1: 90deg clockwise
    this.board = board;
    
    // Positive y is up
    this.pos = new Vec2(
      Math.floor(BOARD_WIDTH / 2 - this.grid[0].length / 2),
      BOARD_HEIGHT + this.grid.length - 1
    );
  }
  
  /**
   * @param {string[][]} board 
   */
  place(board) {
    for (let r = 0; r < this.grid.length; r++) {
      for (let c = 0; c < this.grid[r].length; c++) {
        if (!this.grid[r][c]) continue;
        let y = BOARD_HEIGHT - 1 - this.pos.y + r;
        let x = this.pos.x + c;
        // console.log(x, y)
        if (x < 0 || x >= BOARD_WIDTH || y < 0) continue;
        board[y][x] = this.type;
      }
    }
  }

  rotateClockwise() {
    if (this.type == "O") return;

    let kicks;
    if (this.type === "I") {
      kicks = {
        0: [[-2, 0], [ 1, 0], [-2,-1], [ 1, 2]],
        1: [[-1, 0], [ 2, 0], [-1, 2], [ 2,-1]],
        2: [[ 2, 0], [-1, 0], [ 2, 1], [-1,-2]],
        3: [[ 1, 0], [-2, 0], [ 1,-2], [-2, 1]]
      };
    } else {
      kicks = {
        0: [[-1, 0], [-1, 1], [0, -2], [-1,-2]],
        1: [[ 1, 0], [ 1,-1], [0,  2], [ 1, 2]],
        2: [[ 1, 0], [ 1, 1], [0, -2], [ 1,-2]],
        3: [[-1, 0], [-1,-1], [0,  2], [-1, 2]]
      };
    }
    
    kicks = kicks[this.rotation];
    // console.log(kicks)

    for (const shift of [[0, 0], ...kicks]) {
      let rotated = rotateArrayClockwise(this.grid);
      if (!isIntersecting(this.board, rotated, this.pos.shifted(...shift))) {
        this.rotation++;
        if (this.rotation == 4) this.rotation = 0;
        this.grid = rotated;
        this.pos = this.pos.shifted(...shift);
        return;
      }
    }
  }
}

/**
 * @param {string[][]} board
 * @param {number[][]} piece
 * @param {Vec2} pos
 */
export function isIntersecting(board, piece, pos) {
  for (let r = 0; r < piece.length; r++) {
    for (let c = 0; c < piece[r].length; c++) {
      if (!piece[r][c]) continue;
      let x = pos.x + c;
      let y = BOARD_HEIGHT - 1 - pos.y + r;
      // console.log(x, y)
      if (x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) return true;
      if (y < 0) continue;
      if (board[y][x]) return true;
    }
  }

  return false;
}
