use log::info;

use actix::prelude::*;
use actix_broker::BrokerIssue;
use actix_web_actors::ws;

use std::collections::VecDeque;
use std::time::Duration;

use crate::core::models::{create_message, encode_message, MessageComponents};
use crate::libs::types::{Coords2, Coords3, Quaternion};
use crate::models::{
    self,
    messages::{self, message::Type as MessageType},
};
use crate::utils::convert::{map_voxel_to_chunk, map_world_to_voxel};

use super::message;
use super::message::{Generate, JoinWorld, LeaveWorld};
use super::server::WsServer;
use super::world::WorldMetrics;

const CHUNKING_INTERVAL: Duration = Duration::from_millis(16);

#[derive(Debug, Default)]
pub struct WsSession {
    // unique sessions id
    pub id: usize,
    // client must ping at least once per 10 seconds (CLIENT_TIMEOUT)
    // otherwise we drop connection
    // joined world
    pub world_name: String,
    // world metrics
    pub metrics: Option<WorldMetrics>,
    // name in world
    pub name: Option<String>,
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

impl WsSession {
    pub fn join_world(&mut self, ctx: &mut ws::WebsocketContext<Self>) {
        let world_name = self.world_name.to_owned();

        // First send a leave message for the current room
        let leave_msg = LeaveWorld {
            world_name: self.world_name.clone(),
            client_id: self.id,
        };

        // issue_sync comes from having the `BrokerIssue` trait in scope
        self.issue_system_sync(leave_msg, ctx);

        let join_msg = JoinWorld {
            world_name: world_name.to_owned(),
            client_name: self.name.clone(),
            client: ctx.address().recipient(),
        };

        WsServer::from_registry()
            .send(join_msg)
            .into_actor(self)
            .then(|id, act, _ctx| {
                if let Ok(result) = id {
                    act.id = result.id;
                    act.metrics = Some(result.metrics);
                    act.world_name = world_name;
                }

                fut::ready(())
            })
            .wait(ctx);

        self.chunk(ctx);
    }

    fn chunk(&self, ctx: &mut ws::WebsocketContext<Self>) {
        ctx.run_interval(CHUNKING_INTERVAL, |act, ctx| {
            let requested_chunk = act.requested_chunks.pop_front();

            if let Some(coords) = requested_chunk {
                WsServer::from_registry()
                    .send(message::ChunkRequest {
                        needs_voxels: true,
                        coords: coords.clone(),
                        world_name: act.world_name.to_owned(),
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

    fn on_chunk_request(&mut self, message: messages::Message) {
        let json = message.parse_json().unwrap();

        let cx = json["x"].as_i64().unwrap() as i32;
        let cz = json["z"].as_i64().unwrap() as i32;

        self.requested_chunks.push_back(Coords2(cx, cz));
    }

    fn on_peer(&mut self, message: messages::Message) {
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
        let new_chunk =
            map_voxel_to_chunk(&map_world_to_voxel(&self.position, *dimension), *chunk_size);

        if current_chunk.is_none()
            || current_chunk.unwrap().0 != new_chunk.0
            || current_chunk.unwrap().1 != new_chunk.1
        {
            self.current_chunk = Some(new_chunk.clone());
            WsServer::from_registry().do_send(Generate {
                coords: new_chunk,
                render_radius: self.render_radius,
                world_name: self.world_name.to_owned(),
            });
        }
    }

    fn on_request(&mut self, message: messages::Message) {
        let msg_type = messages::Message::r#type(&message);

        match msg_type {
            MessageType::Request => self.on_chunk_request(message),
            MessageType::Config => {}
            MessageType::Update => {}
            MessageType::Peer => self.on_peer(message),
            MessageType::Message => {}
            MessageType::Init => {
                println!("INIT?")
            }
            _ => {}
        }
    }
}

impl Actor for WsSession {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        // TODO: questionable logic here, why is there a world_name?
        self.join_world(ctx);
    }

    fn stopped(&mut self, _: &mut Self::Context) {
        info!(
            "WsSession closed for {}(id={}) in room {}",
            self.name.clone().unwrap_or_else(|| "unnamed".to_string()),
            self.id,
            self.world_name
        );
    }
}

impl Handler<message::Message> for WsSession {
    type Result = ();

    fn handle(&mut self, msg: message::Message, ctx: &mut Self::Context) {
        let message::Message(msg) = msg;
        let encoded = encode_message(&msg);

        ctx.binary(encoded)
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
            ws::Message::Binary(bytes) => {
                let message = models::decode_message(&bytes.to_vec()).unwrap();
                self.on_request(message);
            }
            ws::Message::Close(reason) => {
                ctx.close(reason);
                ctx.stop();
            }
            _ => (),
        }
    }
}
