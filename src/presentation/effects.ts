import type { CellsRevealed, FlagToggled, GameEvent, GameLost, GameWon, RevealedCell } from '../domain/events';
import type { Position } from '../domain/position';
import type { BoardView } from './board-view';
import type { Particles } from './particles';
import type { Timeline } from './timeline';

const WAVE_MS = 28;
const BIG_FLOOD = 15;
const FIRE = ['#ffd166', '#ff8a3d', '#ff4d5e', '#ffffff'];

export class Effects {
  private readonly palette: string[];

  constructor(
    private readonly board: BoardView,
    private readonly particles: Particles,
    private readonly timeline: Timeline,
  ) {
    const style = getComputedStyle(document.documentElement);
    this.palette = Array.from({ length: 9 }, (_, n) => style.getPropertyValue(`--n${n}`).trim());
  }

  play(events: readonly GameEvent[]): void {
    let revealDuration = 0;
    for (const event of events) {
      switch (event.type) {
        case 'CellsRevealed':
          revealDuration = this.cellsRevealed(event);
          break;
        case 'FlagToggled':
          this.flagToggled(event);
          break;
        case 'GameWon':
          this.timeline.schedule(revealDuration, () => this.gameWon(event));
          break;
        case 'GameLost':
          this.gameLost(event);
          break;
      }
    }
  }

  private cellsRevealed({ cells }: CellsRevealed): number {
    const waves = new Map<number, RevealedCell[]>();
    for (const cell of cells) waves.set(cell.wave, [...(waves.get(cell.wave) ?? []), cell]);

    if (cells.length >= BIG_FLOOD) {
      const origin = this.board.centerOf(cells[0].position);
      this.particles.ring(origin, this.palette[0], 60 + Math.sqrt(cells.length) * 25);
      this.particles.burst(origin, { count: 40, colors: this.palette.slice(0, 3), speed: 520, size: 3.5 });
    }

    const sparksPerCell = cells.length > 80 ? 2 : cells.length >= BIG_FLOOD ? 4 : 10;
    for (const [wave, waveCells] of waves) {
      this.timeline.schedule(wave * WAVE_MS, () => {
        const centers = waveCells.map((cell) => this.board.centerOf(cell.position));
        waveCells.forEach((cell, i) => {
          this.board.reveal(cell);
          this.particles.burst(centers[i], {
            count: sparksPerCell,
            colors: [this.palette[cell.adjacentMines]],
            speed: 160,
            size: 2.2,
            ttl: 0.5,
            gravity: 300,
          });
        });
      });
    }
    return cells[cells.length - 1].wave * WAVE_MS + 300;
  }

  private flagToggled({ position, flagged }: FlagToggled): void {
    this.board.setFlag(position, flagged);
    if (flagged) {
      this.particles.burst(this.board.centerOf(position), { count: 10, colors: ['#ff4d5e', '#ffffff'], speed: 150, size: 2, ttl: 0.4 });
    }
  }

  private gameLost({ exploded, hiddenMines, wrongFlags }: GameLost): void {
    this.board.showMine(exploded, true);
    this.explode(exploded, 1);
    this.board.shake();

    const chain = [...hiddenMines].sort((a, b) => distance(a, exploded) - distance(b, exploded));
    const step = Math.min(90, 1600 / Math.max(chain.length, 1));
    chain.forEach((mine, i) => {
      this.timeline.schedule(250 + i * step, () => {
        this.board.showMine(mine, false);
        this.explode(mine, 0.35);
      });
    });
    this.timeline.schedule(250 + chain.length * step, () => {
      for (const flag of wrongFlags) this.board.showWrongFlag(flag);
    });
  }

  private gameWon({ hiddenMines }: GameWon): void {
    hiddenMines.forEach((mine, i) => this.timeline.schedule(i * 40, () => this.board.setFlag(mine, true)));
    this.particles.confetti(260, this.palette.slice(1, 8));
  }

  private explode(position: Position, power: number): void {
    const center = this.board.centerOf(position);
    this.particles.ring(center, '#ff8a3d', 30 + 140 * power);
    this.particles.burst(center, { count: Math.round(90 * power), colors: FIRE, speed: 200 + 700 * power, size: 4, ttl: 0.9 });
  }
}

function distance(a: Position, b: Position): number {
  return Math.hypot(a.row - b.row, a.col - b.col);
}
