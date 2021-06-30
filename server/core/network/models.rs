use prost::Message;

use std::io::Cursor;

use crate::{core::engine::chunk::Meshes, libs::ndarray::Ndarray};

#[derive(Debug)]
pub struct ChunkProtocol {
    pub x: i32,
    pub z: i32,
    pub meshes: Vec<Meshes>,
    pub voxels: Option<Ndarray<u32>>,
    pub lights: Option<Ndarray<u32>>,
}

#[derive(Debug)]
pub struct PeerProtocol {
    pub id: String,
    pub name: String,
    pub px: f32,
    pub py: f32,
    pub pz: f32,
    pub qx: f32,
    pub qy: f32,
    pub qz: f32,
    pub qw: f32,
}

#[derive(Debug)]
pub struct UpdateProtocol {
    pub vx: i32,
    pub vy: i32,
    pub vz: i32,
    pub r#type: u32,
}

#[derive(Debug)]
pub struct ChatProtocol {
    pub r#type: messages::chat_message::Type,
    pub sender: String,
    pub body: String,
}

#[derive(Debug)]
pub struct MessageComponents {
    pub r#type: messages::message::Type,
    pub json: Option<String>,
    pub text: Option<String>,
    pub message: Option<ChatProtocol>,
    pub peers: Option<Vec<PeerProtocol>>,
    pub chunks: Option<Vec<ChunkProtocol>>,
    pub updates: Option<Vec<UpdateProtocol>>,
}

impl MessageComponents {
    pub fn default_for(message_type: messages::message::Type) -> Self {
        Self {
            r#type: message_type,
            json: None,
            text: None,
            message: None,
            peers: None,
            chunks: None,
            updates: None,
        }
    }
}

pub mod messages {
    include!(concat!(env!("OUT_DIR"), "/protocol.rs"));
}

impl messages::Message {
    pub fn parse_json(&self) -> Result<serde_json::Value, serde_json::Error> {
        serde_json::from_str(&self.json)
    }
}

pub fn create_of_type(r#type: messages::message::Type) -> messages::Message {
    create_message(MessageComponents::default_for(r#type))
}

pub fn create_message(components: MessageComponents) -> messages::Message {
    let mut message = messages::Message {
        r#type: components.r#type as i32,
        ..Default::default()
    };

    if let Some(json) = components.json {
        message.json = json;
    }

    if let Some(text) = components.text {
        message.text = text;
    }

    if let Some(chat_message) = components.message {
        message.message = Some(messages::ChatMessage {
            r#type: chat_message.r#type as i32,
            body: chat_message.body,
            sender: chat_message.sender,
        });
    }

    if let Some(peers) = components.peers {
        message.peers = peers
            .into_iter()
            .map(|peer| messages::Peer {
                id: peer.id,
                name: peer.name,
                px: peer.px,
                py: peer.py,
                pz: peer.pz,
                qx: peer.qx,
                qy: peer.qy,
                qz: peer.qz,
                qw: peer.qw,
            })
            .collect()
    }

    if let Some(chunks) = components.chunks {
        message.chunks = chunks
            .into_iter()
            .map(|chunk| messages::Chunk {
                meshes: chunk
                    .meshes
                    .iter()
                    .map(|mesh| {
                        let opaque = mesh.opaque.as_ref();
                        let transparent = mesh.transparent.as_ref();

                        messages::Mesh {
                            sub_chunk: mesh.sub_chunk,
                            opaque: opaque.map(|opaque| messages::Geometry {
                                aos: opaque.aos.to_owned(),
                                indices: opaque.indices.to_owned(),
                                positions: opaque.positions.to_owned(),
                                sunlights: opaque.sunlights.to_owned(),
                                torch_lights: opaque.torch_lights.to_owned(),
                                uvs: opaque.uvs.to_owned(),
                            }),
                            transparent: transparent.map(|transparent| messages::Geometry {
                                aos: transparent.aos.to_owned(),
                                indices: transparent.indices.to_owned(),
                                positions: transparent.positions.to_owned(),
                                sunlights: transparent.sunlights.to_owned(),
                                torch_lights: transparent.torch_lights.to_owned(),
                                uvs: transparent.uvs.to_owned(),
                            }),
                        }
                    })
                    .collect(),
                lights: if let Some(l) = chunk.lights {
                    l.data
                } else {
                    Vec::<u32>::new()
                },
                voxels: if let Some(v) = chunk.voxels {
                    v.data
                } else {
                    Vec::<u32>::new()
                },
                x: chunk.x,
                z: chunk.z,
            })
            .collect()
    }

    if let Some(updates) = components.updates {
        message.updates = updates
            .into_iter()
            .map(|update| messages::Update {
                r#type: update.r#type,
                vx: update.vx,
                vy: update.vy,
                vz: update.vz,
            })
            .collect()
    }

    message
}

pub fn create_chat_message(
    message_type: messages::message::Type,
    chat_type: messages::chat_message::Type,
    sender: &str,
    body: &str,
) -> messages::Message {
    let mut components = MessageComponents::default_for(message_type);
    components.message = Some(ChatProtocol {
        r#type: chat_type,
        sender: sender.to_owned(),
        body: body.to_owned(),
    });

    create_message(components)
}

pub fn encode_message(message: &messages::Message) -> Vec<u8> {
    let mut buf = Vec::new();
    buf.reserve(message.encoded_len());
    message.encode(&mut buf).unwrap();
    buf
}

pub fn decode_message(buf: &[u8]) -> Result<messages::Message, prost::DecodeError> {
    messages::Message::decode(&mut Cursor::new(buf))
}
