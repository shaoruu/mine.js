type ClockOptions = {
  maxDelta: number;
};

const defaultClockOptions: ClockOptions = {
  maxDelta: 0.3,
};

class Clock {
  public lastFrameTime: number;
  public delta: number;

  public options: ClockOptions;
  public intervals: Map<string, number> = new Map();

  constructor(options: Partial<ClockOptions> = {}) {
    this.options = {
      ...defaultClockOptions,
      ...options,
    };

    this.lastFrameTime = Date.now();
    this.delta = 0;
  }

  tick() {
    const now = Date.now();
    this.delta = Math.min((now - this.lastFrameTime) / 1000, this.options.maxDelta);
    this.lastFrameTime = now;
  }

  registerInterval(name: string, func: () => void, interval: number) {
    const newInterval = window.setInterval(func, interval);
    this.intervals.set(name, newInterval);
    return newInterval;
  }

  clearInterval(name: string) {
    const interval = this.intervals.get(name) as number;
    window.clearInterval(interval);
    return this.intervals.delete(name);
  }

  hasInterval(name: string) {
    return this.intervals.has(name);
  }
}

export { Clock };
