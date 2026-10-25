import { Board } from './board';
import type { Difficulty } from './difficulty';
import type { GameEvent } from './events';
import type { MinePlacer } from './mine-placer';
import type { Position } from './position';

export type GameStatus = 'ready' | 'playing' | 'won' | 'lost';

export class Game {
  private currentStatus: GameStatus = 'ready';
  private flagsPlaced = 0;
  private startedAt = 0;
  private readonly board: Board;

  constructor(
    readonly difficulty: Difficulty,
    private readonly minePlacer: MinePlacer,
  ) {
    this.board = new Board(difficulty.rows, difficulty.cols);
  }

  get status(): GameStatus {
    return this.currentStatus;
  }

  get minesLeft(): number {
    return this.difficulty.mines - this.flagsPlaced;
  }

  reveal(position: Position, now: number): GameEvent[] {
    if (this.isOver()) return [];
    if (this.board.isRevealed(position)) return this.revealAround(position, now);
    if (!this.board.isHidden(position)) return [];
    if (this.currentStatus === 'ready') this.start(position, now);
    return this.open([position], now);
  }

  toggleFlag(position: Position): GameEvent[] {
    if (this.isOver() || this.board.isRevealed(position)) return [];
    const flagged = this.board.toggleFlag(position);
    this.flagsPlaced += flagged ? 1 : -1;
    return [{ type: 'FlagToggled', position, flagged, minesLeft: this.minesLeft }];
  }

  private start(firstClick: Position, now: number): void {
    this.board.placeMines(this.minePlacer.place(this.difficulty, firstClick));
    this.currentStatus = 'playing';
    this.startedAt = now;
  }

  private revealAround(position: Position, now: number): GameEvent[] {
    if (this.board.flaggedNeighborCount(position) !== this.board.adjacentMines(position)) return [];
    const hidden = this.board.hiddenNeighbors(position);
    return hidden.length > 0 ? this.open(hidden, now) : [];
  }

  private open(positions: Position[], now: number): GameEvent[] {
    const mine = positions.find((position) => this.board.hasMine(position));
    if (mine) {
      this.board.explode(mine);
      this.currentStatus = 'lost';
      return [{ type: 'GameLost', exploded: mine, hiddenMines: this.board.hiddenMines(), wrongFlags: this.board.wrongFlags() }];
    }

    const events: GameEvent[] = [{ type: 'CellsRevealed', cells: this.board.reveal(positions) }];
    if (this.board.allSafeCellsRevealed()) {
      this.currentStatus = 'won';
      events.push({ type: 'GameWon', durationMs: now - this.startedAt, hiddenMines: this.board.hiddenMines() });
    }
    return events;
  }

  private isOver(): boolean {
    return this.currentStatus === 'won' || this.currentStatus === 'lost';
  }
}
