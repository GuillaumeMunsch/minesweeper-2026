import type { GameEvent } from '../domain/events';
import type { Game } from '../domain/game';
import type { Position } from '../domain/position';

export class ToggleFlag {
  execute(game: Game, position: Position): readonly GameEvent[] {
    return game.toggleFlag(position);
  }
}
