use std::fs::File;

// THIS FILE IS GARBO
// NEEDS MORE WORK ON THIS ONE
// WILL COME BACK SOON
// PR WELCOMED!!!
use kdtree::distance::squared_euclidean;
use kdtree::KdTree;

use serde::Deserialize;

use server_common::{
    math::smooth_interpolation,
    ndarray::{ndarray, Ndarray},
    noise::Noise,
};

pub const TEMPERATURE_SCALE: f64 = 0.005;
pub const HUMIDITY_SCALE: f64 = 0.002;

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BiomeConfigs {
    pub temperature_scale: f64,
    pub temperature_seed: u32,
    pub humidity_scale: f64,
    pub humidity_seed: u32,
    pub water_height: i32,
    pub solid_threshold: f64,
    pub sample_size: usize,
    pub river: Biome,
    pub biomes: Vec<Biome>,
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
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

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BlocksData {
    pub cover: String,
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Biome {
    pub name: String,

    pub temperature: f64,
    pub humidity: f64,

    pub blocks: BlocksData,

    pub config: BiomeConfig,
}

#[derive(Debug)]
pub struct Biomes {
    pub configs: BiomeConfigs,

    temperature_scale: f64,
    temperature_noise: Noise,

    humidity_scale: f64,
    humidity_noise: Noise,

    presets: KdTree<f64, Biome, Vec<f64>>,
}

impl Default for Biomes {
    fn default() -> Self {
        Self::new()
    }
}

impl Biomes {
    /// https://www.desmos.com/calculator/vjrxi1kyh7
    pub fn new() -> Self {
        let biome_configs: BiomeConfigs =
            serde_json::from_reader(File::open("assets/metadata/biomes.json").unwrap()).unwrap();

        let BiomeConfigs {
            temperature_scale,
            temperature_seed,
            humidity_scale,
            humidity_seed,
            biomes,
            ..
        } = &biome_configs;

        let mut new_biomes = Self {
            temperature_scale: *temperature_scale,
            temperature_noise: Noise::new(*temperature_seed),

            humidity_scale: *humidity_scale,
            humidity_noise: Noise::new(*humidity_seed),

            configs: biome_configs.clone(),
            presets: KdTree::new(2),
        };

        biomes.iter().for_each(|biome| {
            new_biomes.register(biome.to_owned());
        });

        new_biomes
    }

    /// Add a biome to preset
    pub fn register(&mut self, biome: Biome) {
        self.presets
            .add(vec![biome.temperature, biome.humidity], biome)
            .expect("Unable to add biome preset.")
    }

    /// Sample the closet possible #`count` biomes
    pub fn get_biomes(&self, temperature: f64, humidity: f64, count: usize) -> Vec<(f64, &Biome)> {
        let mut results = self
            .presets
            .nearest(&[temperature, humidity], count, &squared_euclidean)
            .expect("Unable to search for biome presets.");

        let mut sum: f64 = results.iter().map(|(dist, _)| dist).sum();
        let average = sum / results.len() as f64;

        let mut d_sum = 0.0;
        results
            .iter()
            .for_each(|(dist, _)| d_sum += (average - dist).abs());

        let d_average = d_sum / results.len() as f64;

        sum += d_average;
        let river = (d_average, &self.configs.river);

        let mut temp = vec![river];
        temp.append(&mut results);
        results = temp;

        results
            .into_iter()
            .map(|(dist, b)| (1.0 - dist / sum, b))
            .collect()
    }

    /// Get the interpolated height of X nearest biomes
    pub fn get_biome(&self, vx: i32, vz: i32, sample: usize) -> Biome {
        let vx = vx as f64;
        let vz = vz as f64;

        let temperature = (self
            .temperature_noise
            .simplex2(vx, vz, self.temperature_scale)
            + 1.0)
            * 0.5;
        let humidity = (self.humidity_noise.simplex2(vx, vz, self.humidity_scale) + 1.0) * 0.5;

        let biomes = self.get_biomes(temperature, humidity, sample);

        if biomes.is_empty() {
            panic!("No biomes found.");
        }

        // https://www.gstatic.com/education/formulas2/355397047/en/weighted_average_formula.svg

        let mut numerator = 0.0;
        let mut denominator = 0.0;

        biomes.iter().for_each(|(weight, b)| {
            let weight = weight.powi(2);
            numerator += weight * b.config.height_offset as f64;
            denominator += weight;
        });

        let height = (numerator / denominator) as i32;

        let mut biome = if height > self.configs.water_height && biomes[0].1.name == "River" {
            biomes[1].1.clone()
        } else {
            biomes[0].1.clone()
        };

        biome.config.height_offset = height;

        biome
    }
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
