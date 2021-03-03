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

  constructor(options: Partial<ClockOptions> = {}) {
    this.options = {
      ...defaultClockOptions,
      ...options,
    };

    this.lastFrameTime = Date.now();
    this.delta = 0;
  }

  tick = () => {
    const now = Date.now();
    this.delta = Math.min((now - this.lastFrameTime) / 1000, this.options.maxDelta);
    this.lastFrameTime = now;
  };
}

export { Clock };
