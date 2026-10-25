export interface Position {
  readonly row: number;
  readonly col: number;
}

export function isAdjacentOrSame(a: Position, b: Position): boolean {
  return Math.abs(a.row - b.row) <= 1 && Math.abs(a.col - b.col) <= 1;
}
