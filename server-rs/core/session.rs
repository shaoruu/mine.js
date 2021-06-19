use actix::prelude::*;
use actix_web_actors::ws;

use std::collections::VecDeque;
use std::time::{Duration, Instant};

use crate::core::models::{create_message, encode_message, MessageComponents};
use crate::libs::types::{Coords2, Coords3, Quaternion};
use crate::models::{
    self,
    messages::{self, message::Type as MessageType},
};
use crate::utils::convert::{map_voxel_to_chunk, map_world_to_voxel};

use super::world::WorldMetrics;
use super::{message, server};

const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(5);
const CHUNKING_INTERVAL: Duration = Duration::from_millis(16);
const CLIENT_TIMEOUT: Duration = Duration::from_secs(10);

#[derive(Debug)]
pub struct WsSession {
    // unique sessions id
    pub id: usize,
    // client must ping at least once per 10 seconds (CLIENT_TIMEOUT)
    // otherwise we drop connection
    pub hb: Instant,
    // joined world
    pub world_name: String,
    // world metrics
    pub metrics: Option<WorldMetrics>,
    // name in world
    pub name: Option<String>,
    // chat server
    pub addr: Addr<server::WsServer>,
    // position in world
    pub position: Coords3<f32>,
    // rotation in world
    pub rotation: Quaternion,
    // current chunk in world
    pub current_chunk: Option<Coords2<i32>>,
    // requested chunk in world
    pub requested_chunks: VecDeque<Coords2<i32>>,
    // radius of render?
    pub render_radius: i16,
}

impl Actor for WsSession {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        self.hb(ctx);

        let addr = ctx.address();
        self.addr
            .send(message::Connect {
                world_name: self.world_name.to_owned(),
                addr: addr.recipient(),
            })
            .into_actor(self)
            .then(|res, act, ctx| {
                match res {
                    Ok(res) => {
                        act.id = res.id;
                        act.metrics = Some(res.metrics);
                    }
                    _ => ctx.stop(),
                }
                fut::ready(())
            })
            .wait(ctx);

        self.chunk(ctx);
    }

    fn stopping(&mut self, _: &mut Self::Context) -> Running {
        self.addr.do_send(message::Disconnect { id: self.id });
        Running::Stop
    }
}

impl Handler<message::Message> for WsSession {
    type Result = ();

    fn handle(&mut self, msg: message::Message, ctx: &mut Self::Context) {
        // TODO: PROTOCOL BUFFER SENDING HERE
        ctx.text(msg.0)
    }
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for WsSession {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        let msg = match msg {
            Err(_) => {
                ctx.stop();
                return;
            }
            Ok(msg) => msg,
        };

        match msg {
            ws::Message::Ping(msg) => {
                self.hb = Instant::now();
                ctx.pong(&msg);
            }
            ws::Message::Pong(_) => {
                self.hb = Instant::now();
            }
            ws::Message::Binary(bytes) => {
                let message = models::decode_message(&bytes.to_vec()).unwrap();
                self.on_request(message);
            }
            ws::Message::Close(reason) => {
                ctx.close(reason);
                ctx.stop();
            }
            ws::Message::Continuation(_) => {
                ctx.stop();
            }
            _ => (),
        }
    }
}

impl WsSession {
    fn hb(&self, ctx: &mut ws::WebsocketContext<Self>) {
        ctx.run_interval(HEARTBEAT_INTERVAL, |act, ctx| {
            if Instant::now().duration_since(act.hb) > CLIENT_TIMEOUT {
                println!("Websocket Client heartbeat failed, disconnecting!");

                act.addr.do_send(message::Disconnect { id: act.id });
                ctx.stop();

                return;
            }

            ctx.ping(b"");
        });
    }

    fn chunk(&self, ctx: &mut ws::WebsocketContext<Self>) {
        ctx.run_interval(CHUNKING_INTERVAL, |act, ctx| {
            let requested_chunk = act.requested_chunks.pop_front();

            if let Some(coords) = requested_chunk {
                act.addr
                    .send(message::ChunkRequest {
                        needs_voxels: true,
                        coords: coords.clone(),
                        world: act.world_name.to_owned(),
                    })
                    .into_actor(act)
                    .then(|res, act, ctx| {
                        match res {
                            Ok(message::ChunkRequestResult { protocol }) => {
                                if protocol.is_none() {
                                    act.requested_chunks.push_back(coords);
                                } else {
                                    let protocol = protocol.unwrap();
                                    let mut components =
                                        MessageComponents::default_for(MessageType::Load);
                                    components.chunks = Some(vec![protocol]);

                                    let message = create_message(components);
                                    let _encoded = encode_message(&message);

                                    // TODO: SEND ENCODED TO CLIENT THROUGH CTX

                                    println!("Meshes received for {:?}", coords);
                                }
                            }
                            _ => ctx.stop(),
                        }
                        fut::ready(())
                    })
                    .wait(ctx);
            }
        });
    }

    fn on_request(&mut self, message: messages::Message) {
        let msg_type = messages::Message::r#type(&message);

        match msg_type {
            MessageType::Request => {
                let json = message.parse_json().unwrap();

                let cx = json["x"].as_i64().unwrap() as i32;
                let cz = json["z"].as_i64().unwrap() as i32;

                self.requested_chunks.push_back(Coords2(cx, cz));
            }
            MessageType::Config => {}
            MessageType::Update => {}
            MessageType::Peer => {
                let messages::Peer {
                    name,
                    px,
                    py,
                    pz,
                    qx,
                    qy,
                    qz,
                    qw,
                    ..
                } = &message.peers[0];

                // means this player just joined.
                if self.name.is_none() {
                    // TODO: broadcast "joined the game" message
                }

                self.name = Some(name.to_owned());
                self.position = Coords3(*px, *py, *pz);
                self.rotation = Quaternion(*qx, *qy, *qz, *qw);

                let WorldMetrics {
                    chunk_size,
                    dimension,
                    ..
                } = self.metrics.as_ref().unwrap();

                let current_chunk = self.current_chunk.as_ref();
                let new_chunk = map_voxel_to_chunk(
                    &map_world_to_voxel(&self.position, *dimension),
                    *chunk_size,
                );

                if current_chunk.is_none()
                    || current_chunk.unwrap().0 != new_chunk.0
                    || current_chunk.unwrap().1 != new_chunk.1
                {
                    self.current_chunk = Some(new_chunk.clone());
                    self.addr.do_send(message::Generate {
                        coords: new_chunk,
                        render_radius: self.render_radius,
                        world: self.world_name.to_owned(),
                    });
                }
            }
            MessageType::Message => {}
            MessageType::Init => {
                println!("INIT?")
            }
            _ => {}
        }
        // println!("TYPE OF MESSAGE: {}", message.r#type);

        // if !message.json.is_empty() {
        //     let json = message
        //         .parse_json()
        //         .expect("DAMN WTF ERROR IN PARSING JSON");
        //     println!("{:?}", json);
        // }
    }
}
