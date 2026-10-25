import type { DifficultyName } from './difficulty';

export interface BestTimesRepository {
  get(difficulty: DifficultyName): number | null;
  save(difficulty: DifficultyName, durationMs: number): void;
}
