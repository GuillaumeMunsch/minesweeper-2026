import type { Difficulty } from '../domain/difficulty';
import type { MinePlacer } from '../domain/mine-placer';
import { isAdjacentOrSame, type Position } from '../domain/position';

export class RandomMinePlacer implements MinePlacer {
  constructor(private readonly random: () => number = Math.random) {}

  place({ rows, cols, mines }: Difficulty, firstClick: Position): Position[] {
    const candidates: Position[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!isAdjacentOrSame({ row, col }, firstClick)) candidates.push({ row, col });
      }
    }
    for (let i = 0; i < mines; i++) {
      const j = i + Math.floor(this.random() * (candidates.length - i));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    return candidates.slice(0, mines);
  }
}
