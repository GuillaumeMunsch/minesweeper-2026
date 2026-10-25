import type { Clock } from '../application/reveal-cell';
import type { Difficulty, DifficultyName } from '../domain/difficulty';
import type { GameEvent } from '../domain/events';
import { query } from './dom';

export interface HudInput {
  restart(difficulty: DifficultyName): void;
}

const FACES = { idle: '🙂', pressing: '😮', won: '😎', lost: '😵' };

export class Hud {
  private readonly mines: HTMLElement;
  private readonly timer: HTMLElement;
  private readonly face: HTMLElement;
  private readonly status: HTMLElement;
  private readonly best: HTMLElement;
  private readonly levels: HTMLButtonElement[];
  private difficulty: DifficultyName = 'beginner';
  private startedAt: number | null = null;
  private ticker = 0;
  private over = false;

  constructor(
    root: HTMLElement,
    input: HudInput,
    private readonly clock: Clock,
  ) {
    this.mines = query(root, '[data-hud="mines"]');
    this.timer = query(root, '[data-hud="timer"]');
    this.face = query(root, '[data-hud="face"]');
    this.status = query(root, '[data-hud="status"]');
    this.best = query(root, '[data-hud="best"]');
    this.levels = [...root.querySelectorAll<HTMLButtonElement>('[data-level]')];

    this.face.addEventListener('click', () => input.restart(this.difficulty));
    for (const level of this.levels) {
      level.addEventListener('click', () => input.restart(level.dataset.level as DifficultyName));
    }
  }

  reset(difficulty: Difficulty, bestTimeMs: number | null): void {
    this.stopTimer();
    this.difficulty = difficulty.name;
    this.startedAt = null;
    this.over = false;
    for (const level of this.levels) level.classList.toggle('active', level.dataset.level === difficulty.name);
    this.mines.textContent = counter(difficulty.mines);
    this.timer.textContent = counter(0);
    this.face.textContent = FACES.idle;
    this.showStatus('', '');
    this.best.textContent = bestTimeMs === null ? 'Pas encore de record' : `Record : ${seconds(bestTimeMs)}`;
  }

  pressing(pressing: boolean): void {
    if (!this.over) this.face.textContent = pressing ? FACES.pressing : FACES.idle;
  }

  apply(events: readonly GameEvent[], newRecord = false): void {
    for (const event of events) {
      switch (event.type) {
        case 'CellsRevealed':
          this.startTimer();
          break;
        case 'FlagToggled':
          this.mines.textContent = counter(event.minesLeft);
          break;
        case 'GameWon':
          this.end(FACES.won);
          this.mines.textContent = counter(0);
          this.showStatus('won', newRecord ? `Nouveau record : ${seconds(event.durationMs)} 🏆` : `Gagné en ${seconds(event.durationMs)}`);
          if (newRecord) this.best.textContent = `Record : ${seconds(event.durationMs)}`;
          break;
        case 'GameLost':
          this.end(FACES.lost);
          this.showStatus('lost', 'Boum. Perdu.');
          break;
      }
    }
  }

  private startTimer(): void {
    if (this.startedAt !== null) return;
    const startedAt = this.clock();
    this.startedAt = startedAt;
    this.ticker = window.setInterval(() => {
      this.timer.textContent = counter(Math.floor((this.clock() - startedAt) / 1000));
    }, 250);
  }

  private stopTimer(): void {
    window.clearInterval(this.ticker);
  }

  private end(face: string): void {
    this.stopTimer();
    this.over = true;
    this.face.textContent = face;
  }

  private showStatus(kind: '' | 'won' | 'lost', text: string): void {
    this.status.className = `status ${kind}`;
    this.status.textContent = text;
  }
}

function counter(value: number): string {
  if (value < 0) return `-${String(Math.min(-value, 99)).padStart(2, '0')}`;
  return String(Math.min(value, 999)).padStart(3, '0');
}

function seconds(durationMs: number): string {
  return `${(durationMs / 1000).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} s`;
}
