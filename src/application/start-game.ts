import type { BestTimesRepository } from '../domain/best-times-repository';
import { DIFFICULTIES, type DifficultyName } from '../domain/difficulty';
import { Game } from '../domain/game';
import type { MinePlacer } from '../domain/mine-placer';

export interface StartedGame {
  readonly game: Game;
  readonly bestTimeMs: number | null;
}

export class StartGame {
  constructor(
    private readonly minePlacer: MinePlacer,
    private readonly bestTimes: BestTimesRepository,
  ) {}

  execute(difficulty: DifficultyName): StartedGame {
    return {
      game: new Game(DIFFICULTIES[difficulty], this.minePlacer),
      bestTimeMs: this.bestTimes.get(difficulty),
    };
  }
}
