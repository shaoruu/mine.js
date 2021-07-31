#![allow(dead_code)]

use std::collections::HashMap;
use std::fs::File;

use serde::{Deserialize, Serialize};

use server_common::types::{Block, TypeMap, UV};
use server_utils::json;

pub type Ranges = HashMap<String, UV>;
pub type Blocks = HashMap<u32, Block>;

/// JSON format for texturepack details
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PackDetails {
    pub dimension: u32,
}

/// Resource to control block data and textures
#[derive(Debug, Clone)]
pub struct Registry {
    pub atlas: image::RgbaImage,
    pub ranges: Ranges,
    pub blocks: Blocks,
    pub uv_side_count: u32,
    pub uv_texture_size: u32,

    name_map: HashMap<String, u32>,
}

impl Registry {
    pub fn new(mut packs: Vec<String>, write: bool) -> Self {
        if packs.is_empty() {
            panic!("No texture packs found.");
        }

        let registry: Self = Registry::load_pack(&packs.remove(0), write);

        packs.into_iter().for_each(|name| {
            Registry::load_pack(&name, write);
        });

        registry
    }

    /// Load a texture pack
    pub fn load_pack(pack_name: &str, write: bool) -> Self {
        let blocks_json: HashMap<String, String> =
            serde_json::from_reader(File::open("assets/metadata/blocks.json").unwrap()).unwrap();

        let mut base_cache: HashMap<String, serde_json::Value> = HashMap::new();
        let mut texture_map: HashMap<String, image::DynamicImage> = HashMap::new();

        let mut name_map = HashMap::new();

        let mut blocks: Blocks = HashMap::new();

        let pack: PackDetails = serde_json::from_reader(
            File::open(format!("assets/textures/packs/{}/pack.json", pack_name)).unwrap(),
        )
        .unwrap();

        for (id, block_file) in blocks_json.iter() {
            let path = format!("./assets/metadata/blocks/{}", block_file);
            let mut block_json: serde_json::Value =
                serde_json::from_reader(File::open(path).unwrap()).unwrap();

            let base = &block_json["base"];

            let base = match base {
                serde_json::Value::String(base_str) => {
                    Some(base_cache.entry(base_str.to_owned()).or_insert_with(|| {
                        serde_json::from_reader(
                            File::open(format!("./assets/metadata/blocks/{}", base_str).as_str())
                                .unwrap(),
                        )
                        .unwrap()
                    }))
                }
                _ => None,
            }
            .unwrap();

            json::merge(&mut block_json, base, false);

            let textures = &block_json["textures"];
            let mut textures_hash = HashMap::new();

            if !serde_json::Value::is_null(textures) {
                for (side, img_src) in textures.as_object().unwrap().iter() {
                    let img_src_str = img_src.as_str().unwrap();

                    let image = if img_src_str.ends_with(".png") {
                        let path =
                            format!("assets/textures/packs/{}/blocks/{}", pack_name, img_src_str);
                        image::open(&path).unwrap_or_else(|_| panic!("Texture not found: {}", path))
                    } else {
                        // texture data
                        let texture_data: serde_json::Value = serde_json::from_reader(
                            File::open(format!("assets/textures/procedural/{}", img_src_str))
                                .unwrap(),
                        )
                        .unwrap();

                        let color_vec = texture_data["color"].as_array().unwrap().as_slice();

                        let color_r = (color_vec[0].as_f64().unwrap() * 255.0) as u8;
                        let color_g = (color_vec[1].as_f64().unwrap() * 255.0) as u8;
                        let color_b = (color_vec[2].as_f64().unwrap() * 255.0) as u8;

                        let imgbuf = image::ImageBuffer::from_pixel(
                            16,
                            16,
                            image::Rgb([color_r, color_g, color_b]),
                        );

                        image::DynamicImage::ImageRgb8(imgbuf)
                    };

                    texture_map.insert(img_src_str.to_owned(), image);
                    textures_hash.insert(side.to_owned(), img_src_str.to_owned());
                }
            }

            let mut new_block: Block = serde_json::from_value(block_json).unwrap();
            new_block.textures = textures_hash;
            let id = id.parse::<u32>().unwrap();
            name_map.insert(new_block.name.clone(), id);
            blocks.insert(id, new_block);
        }

        // OBTAINED TEXTURE MAP
        let map_size = texture_map.len() as f32;
        let mut shifts = 1;
        let count_per_side = map_size.sqrt().ceil() as u32;
        while 1 << shifts < count_per_side {
            shifts += 1;
        }
        let count_per_side = 1 << shifts;
        let texture_dim = pack.dimension;
        let atlas_width = count_per_side * texture_dim;
        let atlas_height = count_per_side * texture_dim;

        let mut atlas: image::RgbaImage = image::ImageBuffer::new(atlas_width, atlas_height);

        let mut ranges = HashMap::new();

        let mut row = 0;
        let mut col = 0;

        let mut texture_map_vec: Vec<_> = texture_map.into_iter().collect();
        texture_map_vec.sort_by(|x, y| x.0.cmp(&y.0));

        for (key, image) in texture_map_vec {
            if col >= count_per_side {
                col = 0;
                row += 1;
            }

            let start_x = col * texture_dim;
            let start_y = row * texture_dim;

            let resized = image::imageops::resize(
                &image,
                texture_dim,
                texture_dim,
                image::imageops::FilterType::CatmullRom,
            );

            image::imageops::overlay(&mut atlas, &resized, start_x, start_y);

            let f_start_x = start_x as f32;
            let f_start_y = start_y as f32;

            let f_atlas_width = atlas_width as f32;
            let f_atlas_height = atlas_height as f32;

            let start_u = f_start_x / f_atlas_width;
            let end_u = (f_start_x + texture_dim as f32) / f_atlas_width;
            let start_v = 1.0 - f_start_y / f_atlas_height;
            let end_v = 1.0 - (f_start_y + texture_dim as f32) / f_atlas_height;

            let (start_u, start_v, end_u, end_v) =
                fix_texture_bleeding((start_u, start_v, end_u, end_v));

            let uv = UV {
                start_u,
                end_u,
                start_v,
                end_v,
            };

            ranges.insert(key, uv);

            col += 1;
        }

        if write {
            atlas
                .save(&format!(
                    "assets/textures/generated/{}-atlas.png",
                    pack_name
                ))
                .unwrap();
        }

        Self {
            atlas,
            ranges,
            blocks,
            uv_texture_size: texture_dim,
            uv_side_count: count_per_side,
            name_map,
        }
    }

    /// Get block transparency by id
    pub fn get_transparency_by_id(&self, id: u32) -> bool {
        self.get_block_by_id(id).is_transparent
    }

    /// Get block transparency by name
    pub fn get_transparency_by_name(&self, name: &str) -> bool {
        self.get_block_by_name(name).is_transparent
    }

    /// Get block fluidity by id
    pub fn get_fluiditiy_by_id(&self, id: u32) -> bool {
        self.get_block_by_id(id).is_fluid
    }

    /// Get block fluidity by name
    pub fn get_fluiditiy_by_name(&self, name: &str) -> bool {
        self.get_block_by_name(name).is_fluid
    }

    /// Get block solidity by id
    pub fn get_solidity_by_id(&self, id: u32) -> bool {
        self.get_block_by_id(id).is_solid
    }

    /// Get block solidity by name
    pub fn get_solidity_by_name(&self, name: &str) -> bool {
        self.get_block_by_name(name).is_solid
    }

    /// Get block emptiness by id
    pub fn get_emptiness_by_id(&self, id: u32) -> bool {
        self.get_block_by_id(id).is_empty
    }

    /// Get block emptiness by name
    pub fn get_emptiness_by_name(&self, name: &str) -> bool {
        self.get_block_by_name(name).is_empty
    }

    /// Get block texture by id
    pub fn get_texture_by_id(&self, id: u32) -> &HashMap<String, String> {
        &self.get_block_by_id(id).textures
    }

    /// Get block texture by name
    pub fn get_texture_by_name(&self, name: &str) -> &HashMap<String, String> {
        &self.get_block_by_name(name).textures
    }

    /// Get block UV by id
    pub fn get_uv_by_id(&self, id: u32) -> HashMap<String, &UV> {
        self.get_uv_map(self.get_block_by_id(id))
    }

    /// Get block UV by name
    pub fn get_uv_by_name(&self, name: &str) -> HashMap<String, &UV> {
        self.get_uv_map(self.get_block_by_name(name))
    }

    /// Check if block is air by id
    pub fn is_air(&self, id: u32) -> bool {
        self.get_block_by_id(id).name == "Air"
    }

    /// Check if block is fluid by id
    pub fn is_fluid(&self, id: u32) -> bool {
        self.get_block_by_id(id).is_fluid
    }

    /// Check if block is a plant by id
    pub fn is_plant(&self, id: u32) -> bool {
        self.get_block_by_id(id).is_plant
    }

    /// Check if block is plantable by id
    pub fn is_plantable(&self, id: u32, above: u32) -> bool {
        self.get_block_by_id(id).is_plantable && self.get_block_by_id(above).is_empty
    }

    /// Get block data by id
    #[inline]
    pub fn get_block_by_id(&self, id: u32) -> &Block {
        self.blocks
            .get(&id)
            .unwrap_or_else(|| panic!("Block id not found: {}", id))
    }

    /// Get block data by name
    pub fn get_block_by_name(&self, name: &str) -> &Block {
        let &id = self
            .name_map
            .get(name)
            .unwrap_or_else(|| panic!("Block name not found: {}", name));
        self.get_block_by_id(id)
    }

    /// Get block id by name
    pub fn get_id_by_name(&self, name: &str) -> &u32 {
        self.name_map
            .get(name)
            .unwrap_or_else(|| panic!("Type name not found: {}", name))
    }

    /// Get UV map by block
    pub fn get_uv_map(&self, block: &Block) -> HashMap<String, &UV> {
        let mut uv_map = HashMap::new();

        for source in block.textures.values().into_iter() {
            let uv = self
                .ranges
                .get(source)
                .unwrap_or_else(|| panic!("UV range not found: {}", source));

            uv_map.insert(source.to_owned(), uv);
        }

        uv_map
    }

    /// Get type map of all blocks
    pub fn get_type_map(&self, blocks: Vec<&str>) -> TypeMap {
        let mut type_map = HashMap::new();

        for block in blocks {
            let &id = self
                .name_map
                .get(block)
                .unwrap_or_else(|| panic!("Block name not found: {}", block));

            type_map.insert(block.to_owned(), id);
        }

        type_map
    }

    /// Get solids that can be treated as empty's
    pub fn get_passable_solids(&self) -> Vec<u32> {
        self.blocks
            .iter()
            .filter(|&(_, b)| !b.is_solid && (b.is_block || b.is_plant))
            .map(|(id, _)| *id)
            .collect()
    }

    /// Check if registery contains type
    pub fn has_type(&self, id: u32) -> bool {
        self.blocks.contains_key(&id)
    }
}

/// Get the JSON string of texture type
pub fn get_texture_type(texture: &HashMap<String, String>) -> &str {
    let len = texture.len();

    if len == 1 {
        "mat1"
    } else if len == 3 {
        "mat3"
    } else if len == 6 {
        "mat6"
    } else {
        "x"
    }
}

/// Fixing texture bleeding with the
/// [Half-texel edge correction method](http://drilian.com/2008/11/25/understanding-half-pixel-and-half-texel-offsets/)
fn fix_texture_bleeding(
    (start_u, start_v, end_u, end_v): (f32, f32, f32, f32),
) -> (f32, f32, f32, f32) {
    let offset = 0.1 / 128 as f32;
    (
        start_u + offset,
        start_v - offset,
        end_u - offset,
        end_v + offset,
    )
}
