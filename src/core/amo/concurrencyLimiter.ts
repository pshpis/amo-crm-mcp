export class ConcurrencyLimiter {
  private readonly queue: Array<() => void> = [];
  private active = 0;

  constructor(private readonly maxConcurrency: number) {
    if (!Number.isInteger(maxConcurrency) || maxConcurrency <= 0) {
      throw new Error('maxConcurrency must be a positive integer');
    }
  }

  get limit(): number {
    return this.maxConcurrency;
  }

  async run<T>(task: () => Promise<T>): Promise<T> {
    if (this.active >= this.maxConcurrency) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }

    this.active += 1;

    try {
      return await task();
    } finally {
      this.active -= 1;
      const next = this.queue.shift();
      next?.();
    }
  }
}
