fn main() {
    prost_build::compile_protos(&["protocol/messages.proto"], &["protocol/", "server-rs/"])
        .unwrap();
}
