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
            render_radius: 8,
            hb: Instant::now(),
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
