/*
  Warnings:

  - A unique constraint covering the columns `[automationRequestId]` on the table `GenerationJob` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "GenerationJob" ADD COLUMN     "automationRequestId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "GenerationJob_automationRequestId_key" ON "GenerationJob"("automationRequestId");
