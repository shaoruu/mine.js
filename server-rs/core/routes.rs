use actix_files as fs;
use actix_web::{get, web, Error, HttpRequest, HttpResponse, Result};
use actix_web_actors::ws;

use std::time::Instant;

use super::super::AppState;
use crate::server;

pub async fn ws_route(
    req: HttpRequest,
    stream: web::Payload,
    data: web::Data<AppState>,
) -> Result<HttpResponse, Error> {
    ws::start(
        server::WsSession {
            id: 0,
            hb: Instant::now(),
            addr: data.server.lock().unwrap().clone(),
            // room: "Main".to_owned(),
            // name: None,
        },
        &req,
        stream,
    )
}

#[get("/")]
pub async fn index() -> Result<fs::NamedFile> {
    Ok(fs::NamedFile::open("public/index.html")?)
}

#[get("/atlas")]
pub async fn atlas() -> Result<fs::NamedFile> {
    Ok(fs::NamedFile::open("textures/atlas.png")?)
}
