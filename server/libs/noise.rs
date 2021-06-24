use noise::{utils::*, NoiseFn, OpenSimplex, Perlin, RidgedMulti, Seedable, Worley};

pub struct NoiseConfig {
    pub octaves: i32,
    pub persistence: f64,
    pub lacunarity: f64,
    pub height_scale: f64,
    pub amplifier: f64,
}

#[derive(Debug)]
pub struct Noise {
    seed: u32,
    perlin: Perlin,
    simplex: OpenSimplex,
    ridged: RidgedMulti,
    worley: Worley,
}

impl Noise {
    pub fn new(seed: u32) -> Self {
        Noise {
            seed,
            perlin: Perlin::new().set_seed(seed),
            simplex: OpenSimplex::new().set_seed(seed),
            ridged: RidgedMulti::new().set_seed(seed),
            worley: Worley::new().set_seed(seed),
        }
    }

    pub fn perlin2(&self, x: f64, z: f64, scale: f64) -> f64 {
        self.perlin.get([x * scale, z * scale])
    }

    pub fn perlin3(&self, x: f64, y: f64, z: f64, scale: f64) -> f64 {
        self.perlin.get([x * scale, y * scale, z * scale])
    }

    pub fn simplex2(&self, x: f64, z: f64, scale: f64) -> f64 {
        self.simplex.get([x * scale, z * scale])
    }

    pub fn simplex3(&self, x: f64, y: f64, z: f64, scale: f64) -> f64 {
        self.simplex.get([x * scale, y * scale, z * scale])
    }

    pub fn ridged2(&self, x: f64, z: f64, scale: f64) -> f64 {
        self.ridged.get([x * scale, z * scale])
    }

    pub fn ridged3(&self, x: f64, y: f64, z: f64, scale: f64) -> f64 {
        self.ridged.get([x * scale, y * scale, z * scale])
    }

    pub fn worley2(&self, x: f64, z: f64, scale: f64) -> f64 {
        self.worley.get([x * scale, z * scale])
    }

    pub fn worley3(&self, x: f64, y: f64, z: f64, scale: f64) -> f64 {
        self.worley.get([x * scale, y * scale, z * scale])
    }

    pub fn fractal_octave_perlin2(&self, x: f64, z: f64, scale: f64, octaves: i32) -> f64 {
        let mut t = 0.0;
        let mut f = 1.0;
        let mut n = 0.0;

        for _ in 0..octaves {
            n += self.perlin2(x * f * scale, z * f * scale, 1.0) / f;
            t += 1.0 / f;
            f *= 2.0;
        }

        n / t
    }

    pub fn fractal_octave_perlin3(&self, x: f64, y: f64, z: f64, scale: f64, octaves: i32) -> f64 {
        let mut t = 0.0;
        let mut f = 1.0;
        let mut n = 0.0;

        for _ in 0..octaves {
            n += self.perlin3(x * f * scale, y * f * scale, z * f * scale, 1.0) / f;
            t += 1.0 / f;
            f *= 2.0;
        }

        n / t
    }

    pub fn octave_perlin2(
        &self,
        x: f64,
        z: f64,
        scale: f64,
        NoiseConfig {
            octaves,
            persistence,
            lacunarity,
            //     height_scale,
            amplifier,
            ..
        }: NoiseConfig,
    ) -> f64 {
        let mut total = 0.0;
        let mut frequency = 1.0;
        let mut amplitude = 1.0;
        let mut max_val = 0.0;

        for _ in 0..octaves {
            total += self.perlin2(x * frequency * scale, z * frequency * scale, 1.0) * amplitude;

            max_val += amplitude;

            amplitude *= persistence;
            frequency *= lacunarity;
        }

        total / max_val * amplifier
    }

    pub fn octave_perlin3(
        &self,
        x: f64,
        y: f64,
        z: f64,
        scale: f64,
        NoiseConfig {
            octaves,
            persistence,
            lacunarity,
            height_scale,
            amplifier,
        }: NoiseConfig,
    ) -> f64 {
        let mut total = 0.0;
        let mut frequency = 1.0;
        let mut amplitude = 1.0;
        let mut max_val = 0.0;

        for _ in 0..octaves {
            total += self.perlin3(
                x * frequency * scale,
                y * frequency * scale,
                z * frequency * scale,
                1.0,
            ) * amplitude;

            max_val += amplitude;

            amplitude *= persistence;
            frequency *= lacunarity;
        }

        total / max_val * amplifier - y * height_scale
    }

    pub fn central_perlin(&self, x: f64, z: f64, scale: f64) -> bool {
        let mut noise3x3 = vec![];

        for i in -1..=1 {
            for j in -1..=1 {
                noise3x3.push(self.perlin2(x + i as f64, z + j as f64, scale));
            }
        }

        let mut max = noise3x3[0];
        let mut maxi = 0;

        for i in 1..noise3x3.len() {
            if max < noise3x3[i] {
                max = noise3x3[i];
                maxi = i;
            }
        }

        maxi == 4
    }

    pub fn central_fractal_perlin(&self, x: f64, z: f64, scale: f64, octaves: i32) -> bool {
        let mut noise3x3 = vec![];

        for i in -1..=1 {
            for j in -1..=1 {
                noise3x3.push(self.fractal_octave_perlin2(
                    x + i as f64,
                    z + j as f64,
                    scale,
                    octaves,
                ));
            }
        }

        let mut max = noise3x3[0];
        let mut maxi = 0;

        for i in 1..noise3x3.len() {
            if max < noise3x3[i] {
                max = noise3x3[i];
                maxi = i;
            }
        }

        maxi == 4
    }

    pub fn central_simplex(&self, x: f64, z: f64, scale: f64) -> bool {
        let mut noise3x3 = vec![];

        for i in -1..=1 {
            for j in -1..=1 {
                noise3x3.push(self.simplex2(x + i as f64, z + j as f64, scale));
            }
        }

        let mut max = noise3x3[0];
        let mut maxi = 0;

        for i in 1..noise3x3.len() {
            if max < noise3x3[i] {
                max = noise3x3[i];
                maxi = i;
            }
        }

        maxi == 4
    }
}
