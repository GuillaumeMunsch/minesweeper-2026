import type { Difficulty, DifficultyName } from '../domain/difficulty';
import type { RevealedCell } from '../domain/events';
import type { Position } from '../domain/position';

export interface BoardInput {
  reveal(position: Position): void;
  flag(position: Position): void;
  press(pressing: boolean): void;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

const MAX_CELL_SIZE: Record<DifficultyName, number> = { beginner: 40, intermediate: 32, expert: 28 };
const LONG_PRESS_MS = 400;

export class BoardView {
  private cells: HTMLElement[][] = [];
  private pressing = false;
  private longPressTimer = 0;

  constructor(
    private readonly root: HTMLElement,
    private readonly input: BoardInput,
  ) {
    root.addEventListener('contextmenu', (event) => event.preventDefault());
    root.addEventListener('pointerdown', (event) => this.onPointerDown(event));
    root.addEventListener('pointerup', (event) => this.onPointerUp(event));
    root.addEventListener('pointerleave', () => this.cancelPress());
    root.addEventListener('pointercancel', () => this.cancelPress());
  }

  render(difficulty: Difficulty): void {
    this.cancelPress();
    this.root.classList.remove('shake');
    this.root.style.setProperty('--cols', String(difficulty.cols));
    this.root.style.setProperty('--max-size', `${MAX_CELL_SIZE[difficulty.name]}px`);
    this.cells = Array.from({ length: difficulty.rows }, (_, row) =>
      Array.from({ length: difficulty.cols }, (_, col) => {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = String(row);
        cell.dataset.col = String(col);
        return cell;
      }),
    );
    this.root.replaceChildren(...this.cells.flat());
  }

  reveal({ position, adjacentMines }: RevealedCell): void {
    const cell = this.cellAt(position);
    cell.className = 'cell revealed';
    cell.dataset.n = String(adjacentMines);
    cell.textContent = adjacentMines > 0 ? String(adjacentMines) : '';
  }

  setFlag(position: Position, flagged: boolean): void {
    this.cellAt(position).classList.toggle('flagged', flagged);
  }

  showMine(position: Position, exploded: boolean): void {
    this.cellAt(position).className = exploded ? 'cell mine exploded' : 'cell mine';
  }

  showWrongFlag(position: Position): void {
    this.cellAt(position).className = 'cell wrong';
  }

  shake(): void {
    this.root.classList.remove('shake');
    void this.root.offsetWidth;
    this.root.classList.add('shake');
  }

  centerOf(position: Position): Point {
    const rect = this.cellAt(position).getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  private onPointerDown(event: PointerEvent): void {
    const position = this.positionOf(event.target);
    if (!position) return;
    if (event.button === 2 || event.ctrlKey) {
      this.input.flag(position);
      return;
    }
    if (event.button !== 0) return;

    this.setPressing(true);
    if (event.pointerType === 'touch') {
      this.longPressTimer = window.setTimeout(() => {
        this.setPressing(false);
        this.input.flag(position);
      }, LONG_PRESS_MS);
    }
  }

  private onPointerUp(event: PointerEvent): void {
    window.clearTimeout(this.longPressTimer);
    if (!this.pressing) return;
    this.setPressing(false);
    const position = this.positionOf(event.target);
    if (position) this.input.reveal(position);
  }

  private cancelPress(): void {
    window.clearTimeout(this.longPressTimer);
    if (this.pressing) this.setPressing(false);
  }

  private setPressing(pressing: boolean): void {
    this.pressing = pressing;
    this.input.press(pressing);
  }

  private positionOf(target: EventTarget | null): Position | null {
    if (!(target instanceof HTMLElement) || !target.classList.contains('cell')) return null;
    return { row: Number(target.dataset.row), col: Number(target.dataset.col) };
  }

  private cellAt({ row, col }: Position): HTMLElement {
    return this.cells[row][col];
  }
}
