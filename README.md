# MinecraftJS

MinecraftJS brings the best-selling PC game "Minecraft" into the web with the power of javascript.

# Motivation

Having to open an additional app to play a game is sometimes too tiring. Therefore, we thought it'd be interesting to somehow implement Minecraft with javascript, essentially bringing the whole Minecraft game into the web. This not only takes away the tedious process of installing the game, it also brings the entire game to players with a couple clicks.

# Screenshots

Simple and working terrain generation
![](https://i.imgur.com/KMg9TUs.png)

Ability to build and break blocks
![](https://i.imgur.com/vRnmoMQ.png)

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
