-- CreateEnum
CREATE TYPE "Gamemode" AS ENUM ('SURVIVAL', 'CREATIVE', 'ADVENTURE', 'SPECTATOR');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('ERROR', 'PLAYER', 'SERVER', 'INFO');

-- CreateEnum
CREATE TYPE "WorldType" AS ENUM ('DEFAULT', 'SUPERFLAT');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "settingsId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" TIMESTAMP(3) NOT NULL,
    "x" DECIMAL(65,30) NOT NULL,
    "y" DECIMAL(65,30) NOT NULL,
    "z" DECIMAL(65,30) NOT NULL,
    "dirx" DECIMAL(65,30) NOT NULL,
    "dirY" DECIMAL(65,30) NOT NULL,
    "health" INTEGER NOT NULL,
    "armor" INTEGER NOT NULL,
    "hunger" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "worldId" INTEGER NOT NULL,
    "gamemode" "Gamemode" NOT NULL,
    "inventoryId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "World" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "seed" TEXT NOT NULL,
    "time" DECIMAL(65,30) NOT NULL,
    "timeChanger" DECIMAL(65,30) NOT NULL,
    "days" INTEGER NOT NULL,
    "lastPlayed" TIMESTAMP(3) NOT NULL,
    "type" "WorldType" NOT NULL DEFAULT E'DEFAULT',
    "userId" INTEGER,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "sender" TEXT,
    "body" TEXT NOT NULL,
    "worldId" INTEGER NOT NULL,
    "type" "MessageType" NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "id" SERIAL NOT NULL,
    "representation" TEXT NOT NULL,
    "type" INTEGER NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "z" INTEGER NOT NULL,
    "worldId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" SERIAL NOT NULL,
    "renderDistance" INTEGER NOT NULL DEFAULT 2,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" SERIAL NOT NULL,
    "cursor" INTEGER NOT NULL,
    "data" TEXT NOT NULL,
    "playerId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User.username_unique" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User.email_unique" ON "User"("email");

-- AddForeignKey
ALTER TABLE "User" ADD FOREIGN KEY ("settingsId") REFERENCES "Settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "World" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;
