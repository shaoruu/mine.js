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
    pub river_scale: f64,
    pub river_seed: u32,
    pub water_height: i32,
    pub solid_threshold: f64,
    pub river_threshold: f64,
    pub radius_scale: f64,
    pub radius_minimum: f64,
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

    pub presets: Vec<Vec<f64>>,

    pub blocks: BlocksData,

    pub config: BiomeConfig,
}

#[derive(Debug)]
pub struct Biomes {
    pub configs: BiomeConfigs,

    temperature_scale: f64,
    temperature_noise: Noise,
    temperature_noise2: Noise,

    humidity_scale: f64,
    humidity_noise: Noise,
    humidity_noise2: Noise,

    river_scale: f64,
    river_noise: Noise,

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
            river_scale,
            river_seed,
            biomes,
            ..
        } = &biome_configs;

        let mut new_biomes = Self {
            temperature_scale: *temperature_scale,
            temperature_noise: Noise::new(*temperature_seed),
            temperature_noise2: Noise::new(*temperature_seed * 2),

            humidity_scale: *humidity_scale,
            humidity_noise: Noise::new(*humidity_seed),
            humidity_noise2: Noise::new(*humidity_seed * 2),

            river_scale: *river_scale,
            river_noise: Noise::new(*river_seed),

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
        biome.presets.iter().for_each(|preset| {
            self.presets
                .add(vec![preset[0], preset[1]], biome.to_owned())
                .expect("Unable to add biome preset.")
        })
    }

    /// Sample the closet possible #`count` biomes
    pub fn get_biomes(&self, temperature: f64, humidity: f64) -> Vec<(f64, &Biome)> {
        let results = self
            .presets
            .nearest(&[temperature, humidity], 1, &squared_euclidean)
            .expect("Unable to search for biome presets.");

        let blend_radius =
            (results[0].0 * self.configs.radius_scale).max(self.configs.radius_minimum);

        let results = self
            .presets
            .within(&[temperature, humidity], blend_radius, &squared_euclidean)
            .unwrap();

        let mut sum_weights = 0.0;

        let results = results
            .into_iter()
            .map(|(dist, b)| {
                let weight = (blend_radius.powi(2) - dist.powi(2)).powi(2);
                sum_weights += weight;
                (weight, b)
            })
            .collect::<Vec<_>>();

        results
            .into_iter()
            .map(|(weight, b)| (weight / sum_weights, b))
            .collect()
    }

    /// Get the interpolated height of X nearest biomes
    pub fn get_biome(&self, vx: i32, vz: i32) -> Biome {
        let vx = vx as f64;
        let vz = vz as f64;

        let temperature = self
            .temperature_noise
            .simplex2(vx, vz, self.temperature_scale)
            + 0.5;
        let humidity = self.humidity_noise.simplex2(vx, vz, self.humidity_scale) + 0.5;

        let biomes = self.get_biomes(temperature, humidity);

        if biomes.is_empty() {
            panic!("No biomes found.");
        }

        // https://www.gstatic.com/education/formulas2/355397047/en/weighted_average_formula.svg

        // let mut scale_numerator = 0.0;
        // let mut octaves_numerator = 0.0;
        // let mut persistence_numerator = 0.0;
        // let mut lacunarity_numerator = 0.0;
        let mut height_offset_numerator = 0.0;
        // let mut height_scale_numerator = 0.0;
        // let mut tree_scale_numerator = 0.0;
        // let mut plant_scale_numerator = 0.0;
        // let mut amplifier_numerator = 0.0;
        let mut denominator = 0.0;

        biomes.iter().for_each(|(weight, b)| {
            // scale_numerator += weight * b.config.scale;
            // octaves_numerator += weight * b.config.octaves as f64;
            // persistence_numerator += weight * b.config.persistence;
            // lacunarity_numerator += weight * b.config.lacunarity;
            height_offset_numerator += weight * b.config.height_offset as f64;
            // height_scale_numerator += weight * b.config.height_scale;
            // tree_scale_numerator += weight * b.config.tree_scale;
            // plant_scale_numerator += weight * b.config.plant_scale;
            // amplifier_numerator += weight * b.config.amplifier;
            denominator += weight;
        });

        // let scale = scale_numerator / denominator;
        // let octaves = (octaves_numerator / denominator).round() as i32;
        // let persistence = persistence_numerator / denominator;
        // let lacunarity = lacunarity_numerator / denominator;
        // let height_scale = height_scale_numerator / denominator;
        let height_offset = (height_offset_numerator / denominator).round() as i32;
        // let tree_scale = tree_scale_numerator / denominator;
        // let plant_scale = plant_scale_numerator / denominator;
        // let amplifier = amplifier_numerator / denominator;

        let mut biome = biomes[0].1.clone();

        // biome.config.scale = scale;
        // biome.config.octaves = octaves;
        // biome.config.persistence = persistence;
        // biome.config.lacunarity = lacunarity;
        // biome.config.height_scale = height_scale;
        // biome.config.height_offset = height_offset;
        // biome.config.tree_scale = tree_scale;
        // biome.config.plant_scale = plant_scale;
        // biome.config.amplifier = amplifier;

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
