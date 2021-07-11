fn main() {
    prost_build::compile_protos(
        &["../../protocol/messages.proto"],
        &["../../protocol/", "../core/"],
    )
    .unwrap();
}
