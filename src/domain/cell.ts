export type CellState = 'hidden' | 'flagged' | 'revealed';

export class Cell {
  state: CellState = 'hidden';
  hasMine = false;
  adjacentMines = 0;
}
