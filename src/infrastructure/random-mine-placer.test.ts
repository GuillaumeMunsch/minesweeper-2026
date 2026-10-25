import { describe, expect, it } from 'vitest';
import { DIFFICULTIES } from '../domain/difficulty';
import { isAdjacentOrSame } from '../domain/position';
import { RandomMinePlacer } from './random-mine-placer';

describe('RandomMinePlacer', () => {
  it('places the exact number of distinct mines, never on or around the first click', () => {
    const placer = new RandomMinePlacer();
    const firstClick = { row: 4, col: 4 };

    for (let run = 0; run < 50; run++) {
      const mines = placer.place(DIFFICULTIES.beginner, firstClick);

      expect(mines).toHaveLength(10);
      expect(new Set(mines.map(({ row, col }) => `${row}:${col}`)).size).toBe(10);
      expect(mines.some((mine) => isAdjacentOrSame(mine, firstClick))).toBe(false);
    }
  });
});
