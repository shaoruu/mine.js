/*
  Warnings:

  - You are about to drop the column `dirY` on the `Player` table. All the data in the column will be lost.
  - Added the required column `diry` to the `Player` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Player" DROP COLUMN "dirY",
ADD COLUMN     "diry" DECIMAL(65,30) NOT NULL;
