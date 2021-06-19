use actix::*;
use actix_files as fs;
use actix_web::{web, App, HttpServer};

use std::sync::Mutex;

mod core;
mod libs;
mod utils;

use crate::core::{models, routes, server};

const SERVER_ADDR: &str = "localhost:8080";

pub struct AppState {
    server: Mutex<Addr<server::WsServer>>,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();

    let data = web::Data::new(AppState {
        server: Mutex::new(server::WsServer::new().start()),
    });

    println!("\n🚀  MineJS running on http://{}", SERVER_ADDR);

    HttpServer::new(move || {
        App::new()
            .app_data(data.clone())
            .service(routes::atlas)
            .service(routes::index)
            .service(web::resource("/ws/").to(routes::ws_route))
            .service(fs::Files::new("/", "public/").show_files_listing())
    })
    .bind(SERVER_ADDR)?
    .run()
    .await
}
