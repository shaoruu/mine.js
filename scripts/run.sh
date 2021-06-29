#!/bin/bash

RUST_BACKTRACE=1 cargo watch -x 'run --release' -i assets -i client -i public -i textures