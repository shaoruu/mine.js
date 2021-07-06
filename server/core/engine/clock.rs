use std::time::SystemTime;

pub struct Clock {
    pub delta: f32,

    prev_time: SystemTime,
}

impl Clock {
    pub fn new() -> Self {
        Self {
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
    }
}
