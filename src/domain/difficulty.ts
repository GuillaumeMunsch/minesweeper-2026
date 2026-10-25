export type DifficultyName = 'beginner' | 'intermediate' | 'expert';

export interface Difficulty {
  readonly name: DifficultyName;
  readonly rows: number;
  readonly cols: number;
  readonly mines: number;
}

export const DIFFICULTIES: Record<DifficultyName, Difficulty> = {
  beginner: { name: 'beginner', rows: 9, cols: 9, mines: 10 },
  intermediate: { name: 'intermediate', rows: 16, cols: 16, mines: 40 },
  expert: { name: 'expert', rows: 16, cols: 30, mines: 99 },
};
