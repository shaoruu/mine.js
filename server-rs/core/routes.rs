use actix_files as fs;
use actix_web::{
    get,
    web::{self, Query},
    Error, HttpRequest, HttpResponse, Result,
};
use actix_web_actors::ws;

use std::{collections::HashMap, time::Instant};

use crate::{
    libs::types::{Coords2, Coords3, Quaternion},
    server,
};

use super::super::AppState;

pub async fn ws_route(
    req: HttpRequest,
    info: Query<HashMap<String, String>>,
    stream: web::Payload,
    data: web::Data<AppState>,
) -> Result<HttpResponse, Error> {
    println!("{:?}", info.get("world"));

    ws::start(
        server::WsSession {
            id: 0,
            name: None,
            render_radius: 8,
            hb: Instant::now(),
            world: String::from("Main"),
            addr: data.server.lock().unwrap().clone(),
            position: Coords3(0.0, 0.0, 0.0),
            rotation: Quaternion(0.0, 0.0, 0.0, 0.0),
            current_chunk: Coords2(0,0,),
            requested_chunks: Vec::new()
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
