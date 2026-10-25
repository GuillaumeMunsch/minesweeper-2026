import { describe, expect, it } from 'vitest';
import type { BestTimesRepository } from '../domain/best-times-repository';
import type { DifficultyName } from '../domain/difficulty';
import { Game } from '../domain/game';
import { RevealCell } from './reveal-cell';

class InMemoryBestTimes implements BestTimesRepository {
  readonly saved = new Map<DifficultyName, number>();

  get(difficulty: DifficultyName): number | null {
    return this.saved.get(difficulty) ?? null;
  }

  save(difficulty: DifficultyName, durationMs: number): void {
    this.saved.set(difficulty, durationMs);
  }
}

function playWinningGame(bestTimes: BestTimesRepository, durationMs: number) {
  const times = [0, durationMs];
  const revealCell = new RevealCell(bestTimes, () => times.shift() ?? 0);
  const game = new Game({ name: 'beginner', rows: 1, cols: 3, mines: 1 }, { place: () => [{ row: 0, col: 2 }] });
  revealCell.execute(game, { row: 0, col: 1 });
  return revealCell.execute(game, { row: 0, col: 0 });
}

describe('RevealCell', () => {
  it('saves the time of a first win as the record', () => {
    const bestTimes = new InMemoryBestTimes();

    const outcome = playWinningGame(bestTimes, 4200);

    expect(outcome.newRecord).toBe(true);
    expect(bestTimes.saved.get('beginner')).toBe(4200);
  });

  it('keeps the record when the win is slower', () => {
    const bestTimes = new InMemoryBestTimes();
    bestTimes.save('beginner', 3000);

    const outcome = playWinningGame(bestTimes, 4200);

    expect(outcome.newRecord).toBe(false);
    expect(bestTimes.saved.get('beginner')).toBe(3000);
  });

  it('touches no record while the game goes on', () => {
    const bestTimes = new InMemoryBestTimes();
    const revealCell = new RevealCell(bestTimes, () => 0);
    const game = new Game({ name: 'beginner', rows: 1, cols: 3, mines: 1 }, { place: () => [{ row: 0, col: 2 }] });

    const outcome = revealCell.execute(game, { row: 0, col: 1 });

    expect(outcome.newRecord).toBe(false);
    expect(bestTimes.saved.size).toBe(0);
  });
});
