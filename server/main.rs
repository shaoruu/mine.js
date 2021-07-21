use log::info;

use actix::SystemService;
use actix_cors::Cors;
use actix_files as fs;
use actix_web::{web, App, HttpServer};

use server_core::network::{message, routes, server::WsServer};

fn setup_logger() -> Result<(), fern::InitError> {
    fern::Dispatch::new()
        .format(|out, message, record| {
            out.finish(format_args!(
                "{} [{}] [{}]: {}",
                chrono::Local::now().format("[%H:%M:%S]"),
                record.level(),
                record.target(),
                message
            ))
        })
        .level(log::LevelFilter::Debug)
        .chain(std::io::stdout())
        // .chain(fern::log_file("output.log")?)
        .apply()?;

    Ok(())
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    setup_logger().expect("Something went wrong with fern...");

    let addr = "localhost:4000";

    let srv = HttpServer::new(move || {
        let cors = Cors::permissive();

        App::new()
            .wrap(cors)
            .service(routes::atlas)
            .service(routes::index)
            .service(routes::worlds)
            .service(routes::world)
            .service(routes::time)
            .service(web::resource("/ws/").to(routes::ws_route))
            .service(fs::Files::new("/models/", "assets/models/objects/").show_files_listing())
            .service(fs::Files::new("/", "public/").show_files_listing())
    })
    .bind(&addr)?;

    info!("🚀  MineJS running on http://{}", &addr);

    // Wake up the sever
    WsServer::from_registry().do_send(message::Noop);

    srv.run().await
}
