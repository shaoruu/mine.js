use std::{
    fs::{self, File},
    path::PathBuf,
    str::FromStr,
};

use server_core::engine::{chunk::Chunk, config::Configs, registry::Registry};
use server_utils::convert::parse_chunk_name;

use indicatif::{ProgressBar, ProgressStyle};

pub fn loop_through_chunks(func: &dyn Fn(&mut Chunk, &Registry)) {
    let configs = Configs::load_worlds("assets/metadata/worlds.json");

    configs.into_iter().for_each(|(name, (meta, config))| {
        if config.save {
            let registry = Registry::new(&meta.texturepack, false);

            let path = PathBuf::from_str(format!("./data/{}/chunks", name).as_ref()).unwrap();

            println!("Processing world: {}", name);

            let save_dir = fs::read_dir(&path).unwrap();
            let pb = ProgressBar::new(save_dir.count() as u64);

            pb.set_style(ProgressStyle::default_bar()
                .template("{spinner:.green} [{elapsed_precise}] [{wide_bar:.cyan/blue}] {bytes}/{total_bytes}")
                .progress_chars("#>-"));

            let save_dir = fs::read_dir(&path).unwrap();

            for chunk_file in save_dir.flatten() {
                let chunk_path = chunk_file.path();
                if let Ok(chunk_data) = File::open(&chunk_path) {
                    let results: Result<serde_json::Value, serde_json::Error> =
                        serde_json::from_reader(chunk_data);
                    if results.is_err() {
                        // remove chunk file
                        fs::remove_file(&chunk_path).unwrap();

                        continue;
                    }
                }

                let chunk_file = chunk_file.file_name().into_string().unwrap();
                let chunk_file = &chunk_file[0..chunk_file.len() - 5];

                let coords = parse_chunk_name(chunk_file);

                let mut chunk = Chunk::new(coords.to_owned(), &config, &path);

                func(&mut chunk, &registry);

                pb.inc(1);
            }

            pb.finish();
        }
    });
}
