#![allow(dead_code)]

use std::time::SystemTime;

pub struct Clock {
    pub time: f32,
    pub tick_speed: f32,

    pub tick: i32,
    pub delta: f32,

    prev_time: SystemTime,
}

impl Clock {
    pub fn new(time: f32, tick_speed: f32) -> Self {
        Self {
            time,
            tick_speed,
            tick: 0,
            delta: 0.0,
            prev_time: SystemTime::now(),
        }
    }

    /// Get the delta in seconds
    pub fn delta_secs(&self) -> f32 {
        self.delta
    }

    /// Get the delta in milliseconds
    pub fn delta_milli(&self) -> f32 {
        self.delta * 1000.0
    }

    /// Set the time of clock
    pub fn set_time(&mut self, time: f32) {
        self.time = time;
    }

    /// Set the tick speed of clock
    pub fn set_tick_speed(&mut self, tick_speed: f32) {
        self.tick_speed = tick_speed;
    }

    /// Process a tick of clock
    ///
    /// Adds `tick_speed` to `time`, and calculate the delta time passed.
    pub fn tick(&mut self) {
        let now = SystemTime::now();

        self.delta = (now
            .duration_since(self.prev_time)
            .expect("Clock may have gone backwards")
            .as_millis() as f32
            / 1000.0)
            .min(0.020);

        self.prev_time = now;

        self.time = (self.time + self.tick_speed * self.delta) % 2400.0;
        self.tick += 1;
    }
}
