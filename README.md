# MinecraftJS

MinecraftJS brings the best-selling PC game "Minecraft" into the web with the power of javascript.

# Motivation

Having to open an additional app to play a game is sometimes too tiring. Therefore, I thought it'd be interesting to somehow implement Minecraft with javascript, essentially bringing the whole Minecraft game into the web. This not only takes away the tedious process of installing the game, it also brings the entire game to players within a couple clicks.

# Screenshots

These are some screenshots taken directly from the project.

## User Authentication

![](https://i.imgur.com/1jwIc4x.jpg)

![](https://i.imgur.com/VKyEP2F.jpg)

![](https://i.imgur.com/GUyan19.jpg)

![](https://i.imgur.com/u52JZ3n.jpg)

## Neatly Styled Game UI

![](https://i.imgur.com/YoVA8P6.jpg)

![](https://i.imgur.com/du58Ifa.png)

## Working Terrain Generation (props to [FreshKoala](https://github.com/mrprokoala))

![](https://i.imgur.com/RbwUMwe.jpg)

![](https://i.imgur.com/sPJ6DE5.jpg)

## Awesome Gameplay

![](https://i.imgur.com/Xw5u4Lx.jpg)

# Build Stack

Javascript.

## Frontend

- [react.js](https://reactjs.org/)
- [react-router](https://github.com/ReactTraining/react-router)
- [apollo](https://www.apollographql.com/)

## Backend

- [prisma](https://www.prisma.io/docs/1.34/get-started/01-setting-up-prisma-new-database-TYPESCRIPT-t002/)
- [graphql-yoga](https://github.com/prisma/graphql-yoga)

## Authentication

- [bcryptjs](https://github.com/dcodeIO/bcrypt.js/)
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken#readme)

# Features

- Player registration
- Save worlds
- Database support

# Installation

Before cloning the repo or doing anything, be sure to install [docker](https://www.docker.com/) and [node](https://nodejs.org/en/) on your computer. After that, run the following commands:

```bash
# Clone the repo
git clone https://github.com/ian13456/minecraft.js.git

# Download packages for server and client with:
npm install

# Start docker containers
cd server/prisma
docker-compose up -d

# Start backend service
cd server
npm start

# Start frontend service
cd client
npm start
```

After these commands, visit `localhost:3000`

# To-do's

- Lighting
- Chat system
- Command system
- Better terrain generation (caves)
- Random structures (villages)
- Inventory system
- Trivial things such as
  - Block breaking cooldowns
  - Special items (swords, pickaxes)
- Better UI designs
- Dockerize the entire project altogether
