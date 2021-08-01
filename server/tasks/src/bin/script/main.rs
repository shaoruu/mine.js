use server_common::noise::{Noise, NoiseConfig};

fn octave_simplex3(
    noise: &Noise,
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
        total += noise.simplex3(
            x * frequency * scale,
            y * frequency * scale,
            z * frequency * scale,
            1.0,
        ) * amplitude;

        max_val += amplitude;

        amplitude *= persistence;
        frequency *= lacunarity;
    }

    total / max_val * amplifier
    // - y * height_scale
}

fn main() {
    let noise = Noise::new(123);

    let mut sum = 0.0;
    let side = 10;

    for vx in -side..side {
        for vy in -side..side {
            for vz in -side..side {
                let val = octave_simplex3(
                    &noise,
                    vx as f64,
                    vy as f64,
                    vz as f64,
                    0.004,
                    NoiseConfig {
                        octaves: 3,
                        height_scale: 0.5,
                        lacunarity: 0.4,
                        persistence: 0.8,
                        amplifier: 0.8,
                    },
                );

                println!("{:?} {}", sum, val);
                sum += val;
            }
        }
    }

    println!("{}, {:?}", sum, sum / (side as f64).powi(2));
}
