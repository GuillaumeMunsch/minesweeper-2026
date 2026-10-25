import type { BestTimesRepository } from '../domain/best-times-repository';
import type { DifficultyName } from '../domain/difficulty';

export class LocalStorageBestTimes implements BestTimesRepository {
  get(difficulty: DifficultyName): number | null {
    try {
      const stored = localStorage.getItem(this.key(difficulty));
      return stored === null ? null : Number(stored);
    } catch {
      return null;
    }
  }

  save(difficulty: DifficultyName, durationMs: number): void {
    try {
      localStorage.setItem(this.key(difficulty), String(durationMs));
    } catch {}
  }

  private key(difficulty: DifficultyName): string {
    return `minesweeper-2026:best:${difficulty}`;
  }
}
