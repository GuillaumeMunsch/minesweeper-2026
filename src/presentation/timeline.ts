export class Timeline {
  private readonly timers = new Set<number>();

  schedule(delayMs: number, run: () => void): void {
    const id = window.setTimeout(() => {
      this.timers.delete(id);
      run();
    }, delayMs);
    this.timers.add(id);
  }

  cancelAll(): void {
    for (const id of this.timers) window.clearTimeout(id);
    this.timers.clear();
  }
}
