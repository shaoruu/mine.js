use rand::{self, rngs::ThreadRng, Rng};

use actix::prelude::*;
use actix_web_actors::ws;

use std::collections::{HashMap, HashSet};
use std::time::{Duration, Instant};

use crate::libs::types::{Coords2, Coords3, Quaternion};
use crate::models::{
    self,
    messages::{self, message::Type as MessageType},
};

const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(5);
const CLIENT_TIMEOUT: Duration = Duration::from_secs(10);

#[derive(Message)]
#[rtype(result = "()")]
pub struct Message(pub String);

#[derive(Message)]
#[rtype(usize)]
pub struct Connect {
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

pub struct WsServer {
    sessions: HashMap<usize, Recipient<Message>>,
    worlds: HashMap<String, HashSet<usize>>,
    rng: ThreadRng,
}

impl WsServer {
    pub fn new() -> WsServer {
        let mut worlds = HashMap::new();
        worlds.insert("Main".to_owned(), HashSet::new());

        WsServer {
            worlds,
            sessions: HashMap::new(),
            rng: rand::thread_rng(),
        }
    }

    pub fn send_message(&self, world: &str, message: &str, skip_id: usize) {
        if let Some(sessions) = self.worlds.get(world) {
            for id in sessions {
                if *id != skip_id {
                    if let Some(addr) = self.sessions.get(id) {
                        addr.do_send(Message(message.to_owned())).unwrap();
                    }
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
        self.sessions.insert(id, msg.addr);

        self.worlds
            .entry("Main".to_owned())
            .or_insert_with(HashSet::new)
            .insert(id);

        id
    }
}

impl Handler<Disconnect> for WsServer {
    type Result = ();

    fn handle(&mut self, msg: Disconnect, _: &mut Context<Self>) {
        let mut rooms: Vec<String> = Vec::new();

        // remove address
        if self.sessions.remove(&msg.id).is_some() {
            // remove session from all rooms
            for (name, sessions) in &mut self.worlds {
                if sessions.remove(&msg.id) {
                    rooms.push(name.to_owned())
                }
            }
        }

        for room in rooms {
            self.send_message(&room, "Someone disconnected", 0)
        }
    }
}

pub struct WsSession {
    // unique sessions id
    pub id: usize,
    // client must ping at least once per 10 seconds (CLIENT_TIMEOUT)
    // otherwise we drop connection
    pub hb: Instant,
    // joined world
    pub world: String,
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
