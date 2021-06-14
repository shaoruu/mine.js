use rand::{self, rngs::ThreadRng, Rng};

use actix::prelude::*;
use actix_web_actors::ws;

use std::collections::HashMap;
use std::fs::File;
use std::time::{Duration, Instant};

use crate::core::world::World;
use crate::libs::types::{Coords2, Coords3, Quaternion};
use crate::models::{
    self,
    messages::{self, message::Type as MessageType},
};
use crate::utils::json;

use super::registry::Registry;

const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(5);
const CLIENT_TIMEOUT: Duration = Duration::from_secs(10);

#[derive(Message)]
#[rtype(result = "()")]
pub struct Message(pub String);

#[derive(Message)]
#[rtype(usize)]
pub struct Connect {
    pub world_name: String,
    pub addr: Recipient<Message>,
}

#[derive(Message)]
#[rtype(result = "()")]
pub struct Disconnect {
    pub id: usize,
}

#[derive(Message)]
#[rtype(result = "()")]
pub struct ClientMessage {
    // id of client session
    pub id: usize,
    // Peer message
    pub msg: models::messages::Message,
    // Room name
    pub room: String,
}

// list of available rooms
pub struct ListWorlds;

impl actix::Message for ListWorlds {
    type Result = Vec<String>;
}

#[derive(Debug)]
pub struct WsServer {
    clients: HashMap<usize, Recipient<Message>>,
    worlds: HashMap<String, World>,
    registry: Registry,
    rng: ThreadRng,
}

impl WsServer {
    pub fn new() -> WsServer {
        let mut worlds: HashMap<String, World> = HashMap::new();

        let worlds_json: serde_json::Value =
            serde_json::from_reader(File::open("metadata/worlds.json").unwrap()).unwrap();

        let world_default = &worlds_json["default"];

        for world_json in worlds_json["worlds"].as_array().unwrap() {
            let mut world_json = world_json.clone();
            json::merge(&mut world_json, world_default, false);

            let new_world = World::load(world_json);
            worlds.insert(new_world.name.to_owned(), new_world);
        }

        WsServer {
            worlds,
            registry: Registry::new(),
            clients: HashMap::new(),
            rng: rand::thread_rng(),
        }
    }

    pub fn send_message(&self, world: &str, message: &str, skip_id: usize) {
        if let Some(world) = self.worlds.get(world) {
            for (id, recipient) in &world.clients {
                if *id != skip_id {
                    recipient.do_send(Message(message.to_owned())).unwrap();
                }
            }
        }
    }
}

impl Actor for WsServer {
    type Context = Context<Self>;
}

impl Handler<Connect> for WsServer {
    type Result = usize;

    fn handle(&mut self, msg: Connect, _: &mut Context<Self>) -> Self::Result {
        println!("Someone joined");

        self.send_message(&"Main".to_owned(), "Someone joined", 0);

        // register session with random id
        let id = self.rng.gen::<usize>();
        self.clients.insert(id, msg.addr.clone()); // ? NOT SURE IF THIS WORKS

        let world_name = msg.world_name;
        let world = self.worlds.get_mut(&world_name).unwrap();
        world.add_client(id, msg.addr.to_owned());

        id
    }
}

impl Handler<ListWorlds> for WsServer {
    type Result = MessageResult<ListWorlds>;

    fn handle(&mut self, _: ListWorlds, _: &mut Context<Self>) -> Self::Result {
        let mut worlds = Vec::new();

        for key in self.worlds.keys() {
            worlds.push(key.to_owned());
        }

        MessageResult(worlds)
    }
}

impl Handler<Disconnect> for WsServer {
    type Result = ();

    fn handle(&mut self, msg: Disconnect, _: &mut Context<Self>) {
        let mut rooms: Vec<String> = Vec::new();

        // remove address
        if self.clients.remove(&msg.id).is_some() {
            // remove session from all rooms
            for world in self.worlds.values_mut() {
                &mut world.clients.remove_entry(&msg.id);
            }
        }

        for room in rooms {
            self.send_message(&room, "Someone disconnected", 0)
        }
    }
}

#[derive(Debug)]
pub struct WsSession {
    // unique sessions id
    pub id: usize,
    // client must ping at least once per 10 seconds (CLIENT_TIMEOUT)
    // otherwise we drop connection
    pub hb: Instant,
    // joined world
    pub world_name: String,
    // name in world
    pub name: Option<String>,
    // chat server
    pub addr: Addr<WsServer>,
    // position in world
    pub position: Coords3<f32>,
    // rotation in world
    pub rotation: Quaternion,
    // current chunk in world
    pub current_chunk: Coords2<i32>,
    // requested chunk in world
    pub requested_chunks: Vec<Coords2<i32>>,
    // radius of render?
    pub render_radius: i16,
}

impl Actor for WsSession {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        self.hb(ctx);

        let addr = ctx.address();
        self.addr
            .send(Connect {
                world_name: self.world_name.to_owned(),
                addr: addr.recipient(),
            })
            .into_actor(self)
            .then(|res, act, ctx| {
                match res {
                    Ok(res) => act.id = res,
                    _ => ctx.stop(),
                }
                fut::ready(())
            })
            .wait(ctx);
    }

    fn stopping(&mut self, _: &mut Self::Context) -> Running {
        self.addr.do_send(Disconnect { id: self.id });
        Running::Stop
    }
}

impl Handler<Message> for WsSession {
    type Result = ();

    fn handle(&mut self, msg: Message, ctx: &mut Self::Context) {
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

                act.addr.do_send(Disconnect { id: act.id });
                ctx.stop();

                return;
            }

            ctx.ping(b"");
        });
    }

    fn on_request(&mut self, message: messages::Message) {
        let msg_type = messages::Message::r#type(&message);

        match msg_type {
            MessageType::Request => {
                let json = message.parse_json().unwrap();

                let cx = json["x"].as_i64().unwrap() as i32;
                let cz = json["z"].as_i64().unwrap() as i32;

                self.requested_chunks.push(Coords2(cx, cz));
            }
            MessageType::Config => {}
            MessageType::Update => {}
            MessageType::Peer => {}
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
