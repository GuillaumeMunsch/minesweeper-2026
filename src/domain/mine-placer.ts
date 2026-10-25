import type { Difficulty } from './difficulty';
import type { Position } from './position';

export interface MinePlacer {
  place(difficulty: Difficulty, firstClick: Position): Position[];
}
