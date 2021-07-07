use actix::SystemService;
use actix_files as fs;
use actix_web::{
    get,
    web::{self, Query},
    Error, HttpRequest, HttpResponse, Result,
};
use actix_web_actors::ws;

use std::{
    collections::HashMap,
    time::{SystemTime, UNIX_EPOCH},
};

use super::{message, server::WsServer, session};

pub async fn ws_route(
    req: HttpRequest,
    params: Query<HashMap<String, String>>,
    stream: web::Payload,
) -> Result<HttpResponse, Error> {
    let world_query = params.get("world");

    let world_name = match world_query {
        Some(name) => name.to_owned(),
        None => {
            let world_names = WsServer::from_registry()
                .send(message::ListWorldNames)
                .await
                .unwrap();
            world_names[0].to_owned()
        }
    };

    let player = session::WsSession {
        world_name,
        render_radius: 12,
        ..Default::default()
    };

    ws::start(player, &req, stream)
}

#[get("/")]
pub async fn index() -> Result<fs::NamedFile> {
    Ok(fs::NamedFile::open("public/index.html")?)
}

#[get("/atlas")]
pub async fn atlas() -> Result<fs::NamedFile> {
    Ok(fs::NamedFile::open("textures/atlas.png")?)
}

#[get("/worlds")]
pub async fn worlds() -> Result<HttpResponse> {
    let worlds_data = WsServer::from_registry()
        .send(message::ListWorlds)
        .await
        .unwrap();
    Ok(HttpResponse::Ok().json(worlds_data))
}

#[get("/world")]
pub async fn world(params: Query<HashMap<String, String>>) -> Result<HttpResponse> {
    let world_query = params.get("world").unwrap().to_owned();
    let world_data = WsServer::from_registry()
        .send(message::GetWorld(world_query))
        .await
        .unwrap();

    Ok(HttpResponse::Ok().json(world_data))
}

#[get("/time")]
pub async fn time(params: Query<HashMap<String, String>>) -> Result<HttpResponse> {
    let world_query = params.get("world").unwrap().to_owned();
    let world_data = WsServer::from_registry()
        .send(message::GetWorld(world_query))
        .await
        .unwrap();

    Ok(HttpResponse::Ok().json(format!(
        "[{},{}]",
        world_data.time,
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("Time went backwards?")
            .as_millis()
    )))
}
