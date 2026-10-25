import { Cell } from './cell';
import type { RevealedCell } from './events';
import type { Position } from './position';

export class Board {
  private readonly cells: Cell[][];
  private mineCount = 0;
  private revealedCount = 0;

  constructor(
    readonly rows: number,
    readonly cols: number,
  ) {
    this.cells = Array.from({ length: rows }, () => Array.from({ length: cols }, () => new Cell()));
  }

  placeMines(mines: readonly Position[]): void {
    for (const mine of mines) {
      this.cellAt(mine).hasMine = true;
      for (const neighbor of this.neighbors(mine)) {
        this.cellAt(neighbor).adjacentMines++;
      }
    }
    this.mineCount = mines.length;
  }

  isHidden(position: Position): boolean {
    return this.cellAt(position).state === 'hidden';
  }

  isRevealed(position: Position): boolean {
    return this.cellAt(position).state === 'revealed';
  }

  hasMine(position: Position): boolean {
    return this.cellAt(position).hasMine;
  }

  toggleFlag(position: Position): boolean {
    const cell = this.cellAt(position);
    cell.state = cell.state === 'flagged' ? 'hidden' : 'flagged';
    return cell.state === 'flagged';
  }

  explode(position: Position): void {
    this.cellAt(position).state = 'revealed';
  }

  adjacentMines(position: Position): number {
    return this.cellAt(position).adjacentMines;
  }

  flaggedNeighborCount(position: Position): number {
    return this.neighbors(position).filter((neighbor) => this.cellAt(neighbor).state === 'flagged').length;
  }

  hiddenNeighbors(position: Position): Position[] {
    return this.neighbors(position).filter((neighbor) => this.isHidden(neighbor));
  }

  reveal(starts: readonly Position[]): RevealedCell[] {
    const revealed: RevealedCell[] = [];
    const queue = starts.map((position) => ({ position, wave: 0 }));
    for (const start of starts) this.cellAt(start).state = 'revealed';
    for (let next = 0; next < queue.length; next++) {
      const { position, wave } = queue[next];
      const { adjacentMines } = this.cellAt(position);
      revealed.push({ position, adjacentMines, wave });
      if (adjacentMines > 0) continue;
      for (const neighbor of this.neighbors(position)) {
        const cell = this.cellAt(neighbor);
        if (cell.state !== 'hidden') continue;
        cell.state = 'revealed';
        queue.push({ position: neighbor, wave: wave + 1 });
      }
    }
    this.revealedCount += revealed.length;
    return revealed;
  }

  allSafeCellsRevealed(): boolean {
    return this.revealedCount === this.rows * this.cols - this.mineCount;
  }

  hiddenMines(): Position[] {
    return this.positionsWhere((cell) => cell.hasMine && cell.state === 'hidden');
  }

  wrongFlags(): Position[] {
    return this.positionsWhere((cell) => !cell.hasMine && cell.state === 'flagged');
  }

  private cellAt({ row, col }: Position): Cell {
    return this.cells[row][col];
  }

  private neighbors({ row, col }: Position): Position[] {
    const neighbors: Position[] = [];
    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) {
        if ((r !== row || c !== col) && r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
          neighbors.push({ row: r, col: c });
        }
      }
    }
    return neighbors;
  }

  private positionsWhere(matches: (cell: Cell) => boolean): Position[] {
    const positions: Position[] = [];
    this.cells.forEach((cells, row) => {
      cells.forEach((cell, col) => {
        if (matches(cell)) positions.push({ row, col });
      });
    });
    return positions;
  }
}
