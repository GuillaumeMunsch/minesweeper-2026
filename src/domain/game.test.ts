import { describe, expect, it } from 'vitest';
import type { Difficulty } from './difficulty';
import type { CellsRevealed, GameEvent } from './events';
import { Game } from './game';
import type { MinePlacer } from './mine-placer';
import type { Position } from './position';

class FixedMinePlacer implements MinePlacer {
  firstClick: Position | null = null;

  constructor(private readonly mines: Position[]) {}

  place(_difficulty: Difficulty, firstClick: Position): Position[] {
    this.firstClick = firstClick;
    return this.mines;
  }
}

function createGame(mines: Position[]): { game: Game; placer: FixedMinePlacer } {
  const placer = new FixedMinePlacer(mines);
  const difficulty: Difficulty = { name: 'beginner', rows: 3, cols: 4, mines: mines.length };
  return { game: new Game(difficulty, placer), placer };
}

function revealedCells(events: readonly GameEvent[]): CellsRevealed['cells'] {
  const event = events.find((e): e is CellsRevealed => e.type === 'CellsRevealed');
  return event?.cells ?? [];
}

function waveOf(events: readonly GameEvent[], position: Position): number | undefined {
  return revealedCells(events).find((c) => c.position.row === position.row && c.position.col === position.col)?.wave;
}

describe('Game', () => {
  it('places the mines on the first reveal, around the clicked cell', () => {
    const { game, placer } = createGame([{ row: 0, col: 3 }, { row: 2, col: 3 }]);

    game.reveal({ row: 0, col: 0 }, 0);

    expect(placer.firstClick).toEqual({ row: 0, col: 0 });
    expect(game.status).toBe('playing');
  });

  it('floods empty cells in waves ordered by distance to the click', () => {
    const { game } = createGame([{ row: 0, col: 3 }, { row: 2, col: 3 }]);

    const events = game.reveal({ row: 0, col: 0 }, 0);

    expect(revealedCells(events)).toHaveLength(9);
    expect(waveOf(events, { row: 0, col: 0 })).toBe(0);
    expect(waveOf(events, { row: 1, col: 1 })).toBe(1);
    expect(waveOf(events, { row: 2, col: 2 })).toBe(2);
    expect(waveOf(events, { row: 1, col: 3 })).toBeUndefined();
  });

  it('reveals only the clicked cell when it touches a mine', () => {
    const { game } = createGame([{ row: 0, col: 3 }, { row: 2, col: 3 }]);

    const events = game.reveal({ row: 1, col: 3 }, 0);

    expect(revealedCells(events)).toEqual([{ position: { row: 1, col: 3 }, adjacentMines: 2, wave: 0 }]);
  });

  it('wins when every safe cell is revealed, with the time since the first reveal', () => {
    const { game } = createGame([{ row: 0, col: 3 }, { row: 2, col: 3 }]);
    game.toggleFlag({ row: 0, col: 3 });
    game.reveal({ row: 0, col: 0 }, 1000);

    const events = game.reveal({ row: 1, col: 3 }, 4500);

    expect(events.at(-1)).toEqual({ type: 'GameWon', durationMs: 3500, hiddenMines: [{ row: 2, col: 3 }] });
    expect(game.status).toBe('won');
  });

  it('loses on a mine, with the other hidden mines and the wrong flags', () => {
    const { game } = createGame([{ row: 0, col: 3 }, { row: 2, col: 3 }, { row: 2, col: 0 }]);
    game.toggleFlag({ row: 2, col: 3 });
    game.toggleFlag({ row: 0, col: 0 });

    const events = game.reveal({ row: 0, col: 3 }, 0);

    expect(events).toEqual([
      { type: 'GameLost', exploded: { row: 0, col: 3 }, hiddenMines: [{ row: 2, col: 0 }], wrongFlags: [{ row: 0, col: 0 }] },
    ]);
    expect(game.status).toBe('lost');
  });

  it('counts the mines left as flags are placed and removed', () => {
    const { game } = createGame([{ row: 0, col: 3 }, { row: 2, col: 3 }]);

    const placed = game.toggleFlag({ row: 1, col: 1 });
    const removed = game.toggleFlag({ row: 1, col: 1 });

    expect(placed).toEqual([{ type: 'FlagToggled', position: { row: 1, col: 1 }, flagged: true, minesLeft: 1 }]);
    expect(removed).toEqual([{ type: 'FlagToggled', position: { row: 1, col: 1 }, flagged: false, minesLeft: 2 }]);
  });

  it('ignores a reveal on a flagged cell and a flag on a revealed cell', () => {
    const { game } = createGame([{ row: 0, col: 3 }, { row: 2, col: 3 }]);
    game.toggleFlag({ row: 1, col: 3 });
    game.reveal({ row: 0, col: 0 }, 0);

    expect(game.reveal({ row: 1, col: 3 }, 0)).toEqual([]);
    expect(game.toggleFlag({ row: 0, col: 0 })).toEqual([]);
  });

  it('opens the unflagged neighbors of a number once all its flags are placed', () => {
    const { game } = createGame([{ row: 0, col: 3 }, { row: 2, col: 3 }]);
    game.reveal({ row: 1, col: 3 }, 0);
    game.toggleFlag({ row: 0, col: 3 });
    game.toggleFlag({ row: 2, col: 3 });

    const events = game.reveal({ row: 1, col: 3 }, 0);

    expect(revealedCells(events)).toEqual([
      { position: { row: 0, col: 2 }, adjacentMines: 1, wave: 0 },
      { position: { row: 1, col: 2 }, adjacentMines: 2, wave: 0 },
      { position: { row: 2, col: 2 }, adjacentMines: 1, wave: 0 },
    ]);
  });

  it('ignores a click on a number whose flags do not match it', () => {
    const { game } = createGame([{ row: 0, col: 3 }, { row: 2, col: 3 }]);
    game.reveal({ row: 1, col: 3 }, 0);
    game.toggleFlag({ row: 0, col: 3 });

    expect(game.reveal({ row: 1, col: 3 }, 0)).toEqual([]);
  });

  it('loses when a wrong flag makes the number open a mine', () => {
    const { game } = createGame([{ row: 0, col: 3 }, { row: 2, col: 3 }]);
    game.reveal({ row: 1, col: 3 }, 0);
    game.toggleFlag({ row: 0, col: 3 });
    game.toggleFlag({ row: 1, col: 2 });

    const events = game.reveal({ row: 1, col: 3 }, 0);

    expect(events).toEqual([
      { type: 'GameLost', exploded: { row: 2, col: 3 }, hiddenMines: [], wrongFlags: [{ row: 1, col: 2 }] },
    ]);
  });

  it('ignores every move once the game is over', () => {
    const { game } = createGame([{ row: 0, col: 3 }, { row: 2, col: 3 }]);
    game.reveal({ row: 0, col: 3 }, 0);

    expect(game.reveal({ row: 0, col: 0 }, 0)).toEqual([]);
    expect(game.toggleFlag({ row: 0, col: 0 })).toEqual([]);
  });
});
