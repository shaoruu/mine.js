# [MineJS](http://mine.iantheearl.io/)

MineJS is a multiplayer voxel engine that runs in your browser! (Probably should change the name to MineRS/MineTS)

## :dart: Disclaimers

Still working on the project daily. **Any PRs are welcomed!** Also, here's the quick TODO list that we're following: [Link](https://www.notion.so/f61d8c4ce1e245b6aba980adf0f1ea7c?v=77f64c4f1ed342a1b25d8af524cb9da0)

Mobs coming soon! (Server-side physics is mostly done.)

## :crown: Motivation

We thought it would be interesting to design a game that is inspired by popular voxel engines such as "Minetest" and "Veloren". With the combination of Rust and TypeScript, we hope to deliver quality graphics and performance, as well as interactive multiplayer game play within a 3D voxel-based environment.

## :camera: Gallery

![](https://i.imgur.com/WMrPzFI.png)

![](https://i.imgur.com/bUm6ph2.png)

![](https://i.imgur.com/52BTtya.png)

![](https://i.imgur.com/IupfBVF.png)

![](https://i.imgur.com/5kGNmdL.png)

![](https://i.imgur.com/2MUrcLb.png)

## :video_game: Controls

- <kbd>R</kbd>: Toggle zoom
- <kbd>T</kbd>: Toggle chat
- <kbd>F</kbd>: Toggle physics
- <kbd>C</kbd>: Toggle perspective
- <kbd>Z</kbd>: Bulk placement
- <kbd>X</kbd>: Bulk desctruction
- <kbd>0-n</kbd>: Change block placement
- <kbd>Space</kbd>: Jump / fly up
- <kbd>W/A/S/D</kbd>: Movements
- <kbd>L-Shift</kbd>: Fly down
- <kbd>L-Mouse</kbd>: Break block
- <kbd>M-Mouse</kbd>: Get block of looking
- <kbd>R-Mouse</kbd>: Place block
- <kbd>Tab</kbd>: Player list

## :ram: Installation

```bash
# go to the folder you save ur projects
cd path/to/folder

# clone the repository
git clone https://github.com/ian13456/mine.js

# cd into mine.js
cd mine.js

# you need yarn for this project
# somewhere here https://classic.yarnpkg.com/en/docs/install/#debian-stable
# after you install yarn, install the dependencies needed
yarn

# next you need cargo watch
cargo install cargo-watch

# next compile protobuf
yarn compile

# next run server
yarn server

# next listen on client changes (separate terminal)
yarn client

# OPEN ANOTHER TERMINAL
yarn watch

# visit localhost:3000
```
