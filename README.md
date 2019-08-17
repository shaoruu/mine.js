![](https://i.imgur.com/SdFI2bi.png)

<a href="https://discord.gg/xQHPHgZ" align="center">
<img src="https://img.shields.io/discord/612114066873516032.svg?style=for-the-badge" />
</a>

### Disclaimer

:pushpin: This project is a work in progress. There's still a lot of features waiting to be implemented, and the game is far from being the actual game.

### **MC.JS brings the best-selling PC game Minecraft into the web with the power of Javascript.**

# Motivation

Having to open an additional app to play a game is sometimes too tiring. Therefore, I thought it'd be interesting to somehow implement Minecraft with javascript, essentially bringing the whole Minecraft game onto the web. This not only takes away the tedious process of installing the game, it also brings the entire game to players within a couple clicks.

# Screenshots

These are some screenshots taken directly from the project.

## User Authentication

![](https://i.imgur.com/7v5dasa.png)

![](https://i.imgur.com/5yYMYGH.png)

![](https://i.imgur.com/9Tr3GmL.png)

![](https://i.imgur.com/vgpqSCV.png)

## Neatly Styled Game UI

![](https://i.imgur.com/PoYFpdQ.jpg)

![](https://i.imgur.com/du58Ifa.png)

## Awesome Graphics

![](https://i.imgur.com/v3aR0E7.png)

![](https://i.imgur.com/tEuhoBx.jpg)

![](https://i.imgur.com/5dadkka.jpg)

![](https://i.imgur.com/extPtZs.png)

# Build Stack

Javascript.

## Frontend

- [three.js](https://threejs.org)
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
# Install the prerequisite libraries
yarn global add prisma graphql-cli

# Clone the repository
git clone https://github.com/ian13456/mc.js.git

# Download packages for both server and client
yarn

# Export environment variables for prisma
# FOR WINDOWS
set PRISMA_MANAGEMENT_API_SECRET=my-secret
# FOR MAC/LINUX (recommend putting this into .bashrc)
export PRISMA_MANAGEMENT_API_SECRET=my-secret

# Start all services
yarn run init # only needed when running for the first time
yarn run start
```

After these commands, visit `localhost:3000`

# Note

:pushpin: MC.JS runs fastest on either Opera or Chrome.

# Sources

- [Resource Pack Used](http://www.9minecraft.net/paper-cut-resource-pack/)
- [Multiplayer Player Mesh](https://github.com/bs-community/skinview3d)
- [Home Page Panorama Library](https://pannellum.org)
