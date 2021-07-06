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

    pub fn tick(&mut self) {
        let now = SystemTime::now();

        self.delta = now
            .duration_since(self.prev_time)
            .expect("Clock may have gone backwards")
            .as_millis() as f32
            / 1000.0;

        self.prev_time = now;

        self.time = (self.time + self.tick_speed * self.delta) % 2400.0;
        self.tick += 1;
    }
}
