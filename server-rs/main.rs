use log::info;

use actix_files as fs;
use actix_web::{web, App, HttpServer};

mod core;
mod libs;
mod utils;

use crate::core::{models, routes};

fn setup_logger() -> Result<(), fern::InitError> {
    fern::Dispatch::new()
        .format(|out, message, record| {
            out.finish(format_args!(
                "{} [{}] [{}]: {}",
                chrono::Local::now().format("[%H:%M:%S]"),
                record.level(),
                record.target(),
                message
            ))
        })
        .level(log::LevelFilter::Debug)
        .chain(std::io::stdout())
        // .chain(fern::log_file("output.log")?)
        .apply()?;

    Ok(())
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    setup_logger().expect("Something went wrong with fern...");

    let addr = "localhost:8080";

    let srv = HttpServer::new(move || {
        App::new()
            .service(routes::atlas)
            .service(routes::index)
            .service(routes::worlds)
            .service(web::resource("/ws/").to(routes::ws_route))
            .service(fs::Files::new("/", "public/").show_files_listing())
    })
    .bind(&addr)?;

    info!("🚀  MineJS running on http://{}", &addr);

    srv.run().await
}
