use rand::{self, rngs::ThreadRng, Rng};

use actix::prelude::*;
use actix_web_actors::ws;

use std::collections::{HashMap, HashSet};
use std::time::{Duration, Instant};

use crate::models::{self, messages};

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
pub struct ListRooms;

impl actix::Message for ListRooms {
    type Result = Vec<String>;
}

pub struct WsServer {
    sessions: HashMap<usize, Recipient<Message>>,
    rooms: HashMap<String, HashSet<usize>>,
    rng: ThreadRng,
}

impl WsServer {
    pub fn new() -> WsServer {
        let mut rooms = HashMap::new();
        rooms.insert("Main".to_owned(), HashSet::new());

        WsServer {
            rooms,
            sessions: HashMap::new(),
            rng: rand::thread_rng(),
        }
    }

    pub fn send_message(&self, room: &str, message: &str, skip_id: usize) {
        if let Some(sessions) = self.rooms.get(room) {
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

        self.rooms
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
            for (name, sessions) in &mut self.rooms {
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
    pub id: usize,
    pub hb: Instant,
    pub addr: Addr<WsServer>,
    // room: String,
    // name: Option<String>,
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

    fn on_request(&self, message: messages::Message) {
        let msg_type = messages::Message::r#type(&message);

        println!("TYPE OF MESSAGE: {} - {:?}", message.r#type, msg_type);

        match msg_type {
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
