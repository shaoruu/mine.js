use libflate::zlib::Encoder;

use std::io::Write;

use log::{debug, info};

use ansi_term::Colour::Yellow;

use actix::prelude::*;
use actix_broker::BrokerIssue;
use actix_web_actors::ws;

use crate::core::message::ChatMessage;
use crate::core::models::{create_of_type, encode_message};
use crate::libs::types::{Coords2, Coords3, Quaternion};
use crate::models::{
    self,
    messages::{self, message::Type as MessageType},
};

use super::message::{self, ConfigWorld, PlayerUpdate, UpdateVoxel};
use super::message::{JoinWorld, LeaveWorld};
use super::server::WsServer;

#[derive(Debug, Default)]
pub struct WsSession {
    // unique sessions id
    pub id: usize,
    // joined world
    pub world_name: String,
    // name in world
    pub name: Option<String>,
    // radius of render?
    pub render_radius: i16,
}

impl WsSession {
    pub fn join_world(&self, ctx: &mut ws::WebsocketContext<Self>) {
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
            client_addr: ctx.address().recipient(),
            render_radius: self.render_radius,
        };

        WsServer::from_registry()
            .send(join_msg)
            .into_actor(self)
            .then(|id, act, ctx| {
                if let Ok(result) = id {
                    act.id = result.id;
                    act.world_name = world_name;

                    // TODO: fix this?
                    let passables: Vec<String> =
                        result.passables.iter().map(|&id| id.to_string()).collect();
                    let passables = passables.join(",");
                    let data = format!(
                        r#"
                    {{
                        "id": "{}",
                        "time": {},
                        "tickSpeed": {},
                        "spawn": [{}, {}, {}],
                        "passables": {}
                    }}
                    "#,
                        result.id,
                        result.time,
                        result.tick_speed,
                        result.spawn[0],
                        result.spawn[1],
                        result.spawn[2],
                        format!("[{}]", passables)
                    );

                    let mut message = create_of_type(messages::message::Type::Init);
                    message.json = data;
                    let encoded = encode_message(&message);

                    ctx.binary(encoded);
                }

                fut::ready(())
            })
            .wait(ctx);
    }

    fn on_chunk_request(&self, message: messages::Message) {
        let json = message.parse_json().unwrap();

        let cx = json["x"].as_i64().unwrap() as i32;
        let cz = json["z"].as_i64().unwrap() as i32;

        let update = PlayerUpdate {
            client_id: self.id,
            chunk: Some(Coords2(cx, cz)),
            world_name: self.world_name.to_owned(),
            ..Default::default()
        };

        WsServer::from_registry().do_send(update);
    }

    fn on_config(&self, message: messages::Message) {
        let json = message.parse_json().unwrap();

        let time = json["time"].as_f64();
        let tick_speed = json["tickSpeed"].as_f64();

        let config = ConfigWorld {
            world_name: self.world_name.to_owned(),
            tick_speed,
            time,
            json,
        };

        WsServer::from_registry().do_send(config);
    }

    fn on_update(&mut self, message: messages::Message) {
        let json = message.parse_json().unwrap();

        let vx = json["x"].as_i64().unwrap() as i32;
        let vy = json["y"].as_i64().unwrap() as i32;
        let vz = json["z"].as_i64().unwrap() as i32;
        let vtype = json["type"].as_u64().unwrap() as u32;

        let update = UpdateVoxel {
            vx,
            vy,
            vz,
            id: vtype,
            world_name: self.world_name.to_owned(),
        };

        WsServer::from_registry().do_send(update);
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

        // TODO: fix this ambiguous logic
        if self.name.is_none() {
            let message = format!(
                "{}(id={}) joined the world {}",
                name.clone(),
                self.id,
                self.world_name
            );

            info!("{}", Yellow.bold().paint(message));
        }

        self.name = Some(name.to_owned());
        let position = Coords3(*px, *py, *pz);
        let rotation = Quaternion(*qx, *qy, *qz, *qw);

        // TODO: fix this monstrosity of cloning
        WsServer::from_registry().do_send(PlayerUpdate {
            client_id: self.id,
            world_name: self.world_name.to_owned(),
            name: self.name.to_owned(),
            position: Some(position),
            rotation: Some(rotation),
            chunk: None,
        });
    }

    fn on_chat_message(&self, message: messages::Message) {
        WsServer::from_registry().do_send(ChatMessage {
            message: message.message.unwrap(),
            world_name: self.world_name.to_owned(),
        });
    }

    fn on_request(&mut self, message: messages::Message) {
        let msg_type = messages::Message::r#type(&message);

        match msg_type {
            MessageType::Request => self.on_chunk_request(message),
            MessageType::Config => self.on_config(message),
            MessageType::Update => self.on_update(message),
            MessageType::Peer => self.on_peer(message),
            MessageType::Message => self.on_chat_message(message),
            _ => {}
        }
    }
}

impl Actor for WsSession {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        self.join_world(ctx);
    }

    fn stopped(&mut self, ctx: &mut Self::Context) {
        let message = format!(
            "{}(id={}) left the world {}",
            self.name.clone().unwrap_or_else(|| "unnamed".to_string()),
            self.id,
            self.world_name
        );

        info!("{}", Yellow.bold().paint(message));

        let leave_msg = LeaveWorld {
            world_name: self.world_name.clone(),
            client_id: self.id,
        };

        WsServer::from_registry().do_send(leave_msg);
    }
}

impl Handler<message::Message> for WsSession {
    type Result = ();

    fn handle(&mut self, msg: message::Message, ctx: &mut Self::Context) {
        let message::Message(msg) = msg;
        let encoded = encode_message(&msg);

        if encoded.len() > 1024 {
            let mut encoder = Encoder::new(Vec::new()).unwrap();
            encoder.write_all(encoded.as_slice()).unwrap();
            let encoded = encoder.finish().into_result().unwrap();
            ctx.binary(encoded);
        } else {
            ctx.binary(encoded);
        }
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
