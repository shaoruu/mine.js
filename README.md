# [MineJS](http://mine.iantheearl.io/)

MineJS is a multiplayer voxel engine that runs in your browser! (Probably should change the name to MineRS/MineTS)


**Any PRs are welcomed!** 
Here's the quick TODO list that we're following: [Link](https://www.notion.so/f61d8c4ce1e245b6aba980adf0f1ea7c?v=77f64c4f1ed342a1b25d8af524cb9da0)

## :dart: Disclaimers

This is purely a passionate project. Although inspired, I have no intention for this game to be affiliated with Minecraft, or any licensed voxel engines. Further, textures and assets used in the game are all licensed for free use. More information can be found in last section.

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

- <kbd>V</kbd>: Toggle zoom
- <kbd>R</kbd>: Toggle sprint
- <kbd>T</kbd>: Toggle chat
- <kbd>J</kbd>: Toggle debug 
- <kbd>F</kbd>: Toggle physics
- <kbd>C</kbd>: Toggle perspective
- <kbd>K</kbd>: Toggle fullscreen
- <kbd>Z</kbd>: Bulk placement
- <kbd>X</kbd>: Bulk destruction 
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

### :notebook: Citations
- [Ponderosa Font](https://www.1001fonts.com/ponderosa-font.html) - [Licensed](http://www.fontframe.com/tepidmonkey) for non-commercial and commercial use.
- [Open Source Voxel Textures](https://opengameart.org/content/voxel-pack) - Licensed under OpenGameArt for free use.
- [Flourish Resource Pack](https://www.minecraftforum.net/forums/mapping-and-modding-java-edition/resource-packs/1245961-16x-1-7-4-wip-flourish) - Licensed for free use.
- [Alvoria's Sanity](https://www.minecraftforum.net/forums/mapping-and-modding-java-edition/resource-packs/1243771-alvorias-sanity-1-12-2-no-longer-updating-sorry) - Licensed for free use under the [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International Public License.](https://www.minecraftforum.net/linkout?remoteUrl=http%253a%252f%252fcreativecommons.org%252flicenses%252fby-nc-sa%252f4.0%252f)
- [Pixel Perfection](https://www.minecraftforum.net/forums/mapping-and-modding-java-edition/resource-packs/1242533-pixel-perfection-now-with-polar-bears-1-11) - Licensed for free use under the [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International Public License.](https://www.minecraftforum.net/linkout?remoteUrl=http%253a%252f%252fcreativecommons.org%252flicenses%252fby-nc-sa%252f4.0%252f)