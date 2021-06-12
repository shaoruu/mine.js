use actix::*;
use actix_files as fs;
use actix_web::{web, App, HttpServer};

use std::sync::Mutex;

mod core;

use crate::core::{models, registry, routes, server};

pub struct AppState {
    registry: Mutex<registry::Registry>,
    server: Mutex<Addr<server::WsServer>>,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();

    let data = web::Data::new(AppState {
        registry: Mutex::new(registry::Registry::new()),
        server: Mutex::new(server::WsServer::new().start()),
    });

    HttpServer::new(move || {
        App::new()
            .app_data(data.clone())
            .service(routes::atlas)
            .service(routes::index)
            .service(web::resource("/ws/").to(routes::ws_route))
            .service(fs::Files::new("/", "public/").show_files_listing())
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
