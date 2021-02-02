/*
  Warnings:

  - You are about to alter the column `timeChanger` on the `World` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Float`.

*/
-- AlterTable
ALTER TABLE "World" ALTER COLUMN "timeChanger" DROP NOT NULL,
ALTER COLUMN "timeChanger" SET DATA TYPE DECIMAL(65,30);
