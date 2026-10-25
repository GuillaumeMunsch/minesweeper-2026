import type { Position } from './position';

export interface RevealedCell {
  readonly position: Position;
  readonly adjacentMines: number;
  readonly wave: number;
}

export interface CellsRevealed {
  readonly type: 'CellsRevealed';
  readonly cells: readonly RevealedCell[];
}

export interface FlagToggled {
  readonly type: 'FlagToggled';
  readonly position: Position;
  readonly flagged: boolean;
  readonly minesLeft: number;
}

export interface GameWon {
  readonly type: 'GameWon';
  readonly durationMs: number;
  readonly hiddenMines: readonly Position[];
}

export interface GameLost {
  readonly type: 'GameLost';
  readonly exploded: Position;
  readonly hiddenMines: readonly Position[];
  readonly wrongFlags: readonly Position[];
}

export type GameEvent = CellsRevealed | FlagToggled | GameWon | GameLost;
