use server_common::{
    math::smooth_interpolation,
    ndarray::{ndarray, Ndarray},
    noise::Noise,
};

pub const TEMPERATURE_SCALE: f64 = 0.005;
pub const HUMIDITY_SCALE: f64 = 0.002;

pub struct BiomeConfig {
    pub scale: f64,
    pub octaves: i32,
    pub persistence: f64,
    pub lacunarity: f64,
    pub height_offset: i32,
    pub height_scale: f64,
    pub tree_scale: f64,
    pub plant_scale: f64,
    pub amplifier: f64,
}

const HILL_BIOME_CONFIG: BiomeConfig = BiomeConfig {
    scale: 0.001,
    octaves: 4,
    persistence: 0.8,
    lacunarity: 1.4,
    height_offset: 60,
    height_scale: 0.04,
    tree_scale: 0.1,
    plant_scale: 0.2,
    amplifier: 1.8,
};

const PLAIN_BIOME_CONFIG: BiomeConfig = BiomeConfig {
    scale: 0.03,
    octaves: 2,
    persistence: 0.6,
    lacunarity: 0.8,
    height_offset: 50,
    height_scale: 0.05,
    tree_scale: 0.03,
    plant_scale: 0.8,
    amplifier: 0.4,
};

pub const CAVE_SCALE: f64 = 0.03;

pub fn get_biome_config(vx: i32, vz: i32, noise: &Noise) -> (i32, BiomeConfig) {
    let vx = vx as f64;
    let vz = vz as f64;

    let temp = noise.perlin2(vx, vz, TEMPERATURE_SCALE).abs();
    let humidity = noise.perlin2(vx, vz, HUMIDITY_SCALE).abs();

    if temp < 0.23 && humidity < 0.23 {
        return (50, HILL_BIOME_CONFIG);
    }

    (50, PLAIN_BIOME_CONFIG)
}

#[allow(dead_code)]
pub fn get_height_within(
    x_min: i32,
    z_min: i32,
    x_max: i32,
    z_max: i32,
    noise: &Noise,
) -> Ndarray<i32> {
    let mut height_map = ndarray(vec![(x_max - x_min) as usize, (z_max - z_min) as usize], 0);

    let bottom_left = get_biome_config(x_min, z_min, noise).1.height_offset as f64;
    let bottom_right = get_biome_config(x_max, z_min, noise).1.height_offset as f64;
    let top_left = get_biome_config(x_min, z_max, noise).1.height_offset as f64;
    let top_right = get_biome_config(x_max, z_max, noise).1.height_offset as f64;

    for x in x_min..x_max {
        for z in z_min..z_max {
            let h = smooth_interpolation(
                bottom_left,
                top_left,
                bottom_right,
                top_right,
                x_min as f64,
                x_max as f64,
                z_min as f64,
                z_max as f64,
                x as f64,
                z as f64,
            );

            height_map[&[(x - x_min) as usize, (z - z_min) as usize]] = h as i32;
        }
    }

    height_map
}
