use prost::Message;
use std::io::Cursor;

pub mod messages {
    include!(concat!(env!("OUT_DIR"), "/protocol.rs"));
}

impl messages::Message {
    pub fn parse_json(&self) -> Result<serde_json::Value, serde_json::Error> {
        serde_json::from_str(&self.json)
    }
}

// pub fn create_message(json: String) -> messages::Message {
//     let mut message = messages::Message::default();
//     message.json = json;
//     message
// }

// pub fn encode_message(message: &messages::Message) -> Vec<u8> {
//     let mut buf = Vec::new();
//     buf.reserve(message.encoded_len());
//     message.encode(&mut buf).unwrap();
//     buf
// }

pub fn decode_message(buf: &[u8]) -> Result<messages::Message, prost::DecodeError> {
    messages::Message::decode(&mut Cursor::new(buf))
}
