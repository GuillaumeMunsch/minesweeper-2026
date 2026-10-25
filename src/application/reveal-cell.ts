import type { BestTimesRepository } from '../domain/best-times-repository';
import type { GameEvent, GameWon } from '../domain/events';
import type { Game } from '../domain/game';
import type { Position } from '../domain/position';

export type Clock = () => number;

export interface RevealOutcome {
  readonly events: readonly GameEvent[];
  readonly newRecord: boolean;
}

export class RevealCell {
  constructor(
    private readonly bestTimes: BestTimesRepository,
    private readonly clock: Clock,
  ) {}

  execute(game: Game, position: Position): RevealOutcome {
    const events = game.reveal(position, this.clock());
    const won = events.find((event): event is GameWon => event.type === 'GameWon');
    if (!won) return { events, newRecord: false };

    const best = this.bestTimes.get(game.difficulty.name);
    const newRecord = best === null || won.durationMs < best;
    if (newRecord) this.bestTimes.save(game.difficulty.name, won.durationMs);
    return { events, newRecord };
  }
}
