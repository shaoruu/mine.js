/*
  Warnings:

  - You are about to drop the column `inventoryId` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `settingsId` on the `User` table. All the data in the column will be lost.
  - The migration will add a unique constraint covering the columns `[playerId]` on the table `Inventory`. If there are existing duplicate values, the migration will fail.
  - The migration will add a unique constraint covering the columns `[userId]` on the table `Settings`. If there are existing duplicate values, the migration will fail.
  - Added the required column `userId` to the `Settings` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Player" DROP CONSTRAINT "Player_inventoryId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_settingsId_fkey";

-- AlterTable
ALTER TABLE "Player" DROP COLUMN "inventoryId";

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "settingsId";

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_playerId_unique" ON "Inventory"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_userId_unique" ON "Settings"("userId");

-- AddForeignKey
ALTER TABLE "Inventory" ADD FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
