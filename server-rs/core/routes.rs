use actix_files as fs;
use actix_web::{
    get,
    web::{self, Query},
    Error, HttpRequest, HttpResponse, Result,
};
use actix_web_actors::ws;

use std::{
    collections::{HashMap, VecDeque},
    time::Instant,
};

use crate::{
    libs::types::{Coords3, Quaternion},
    server,
};

use super::super::AppState;

pub async fn ws_route(
    req: HttpRequest,
    params: Query<HashMap<String, String>>,
    stream: web::Payload,
    data: web::Data<AppState>,
) -> Result<HttpResponse, Error> {
    let world_query = params.get("world");
    let addr = data.server.lock().unwrap().clone();

    let world_name = match world_query {
        Some(name) => name.to_owned(),
        None => {
            let worlds = addr.send(server::ListWorlds).await.unwrap();
            worlds[0].to_owned()
        }
    };

    ws::start(
        server::WsSession {
            addr,
            id: 0,
            name: None,
            world_name,
            metrics: None,
            render_radius: 12,
            hb: Instant::now(),
            current_chunk: None,
            position: Coords3(0.0, 0.0, 0.0),
            rotation: Quaternion(0.0, 0.0, 0.0, 0.0),
            requested_chunks: VecDeque::new(),
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
