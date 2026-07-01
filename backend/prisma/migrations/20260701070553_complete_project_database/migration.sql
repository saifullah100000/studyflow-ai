/*
  Warnings:

  - The primary key for the `GenerationJob` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `noteId` on the `GenerationJob` table. All the data in the column will be lost.
  - You are about to drop the column `whatsappDelivered` on the `GenerationJob` table. All the data in the column will be lost.
  - The primary key for the `Note` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `difficulty` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `Note` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `whatsappNumber` on the `User` table. All the data in the column will be lost.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[generationJobId]` on the table `Note` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "QuizQuestionType" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER');

-- CreateEnum
CREATE TYPE "FileKind" AS ENUM ('SOURCE', 'GENERATED_PDF', 'GENERATED_DOCX', 'OTHER');

-- CreateEnum
CREATE TYPE "DeliveryChannel" AS ENUM ('WHATSAPP', 'EMAIL');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED');

-- DropForeignKey
ALTER TABLE "GenerationJob" DROP CONSTRAINT "GenerationJob_noteId_fkey";

-- DropForeignKey
ALTER TABLE "GenerationJob" DROP CONSTRAINT "GenerationJob_userId_fkey";

-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_userId_fkey";

-- DropIndex
DROP INDEX "GenerationJob_noteId_key";

-- DropIndex
DROP INDEX "GenerationJob_status_idx";

-- DropIndex
DROP INDEX "Note_createdAt_idx";

-- AlterTable
ALTER TABLE "GenerationJob" DROP CONSTRAINT "GenerationJob_pkey",
DROP COLUMN "noteId",
DROP COLUMN "whatsappDelivered",
ADD COLUMN     "inputFileId" TEXT,
ADD COLUMN     "prompt" TEXT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD CONSTRAINT "GenerationJob_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Note" DROP CONSTRAINT "Note_pkey",
DROP COLUMN "difficulty",
DROP COLUMN "language",
DROP COLUMN "subject",
ADD COLUMN     "generationJobId" TEXT,
ADD COLUMN     "summary" TEXT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "topic" DROP NOT NULL,
ALTER COLUMN "content" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Note_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "whatsappNumber",
ALTER COLUMN "id" SET DATA TYPE TEXT,
DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER',
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- DropEnum
DROP TYPE "Difficulty";

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "NoteSection" (
    "id" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "noteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NoteSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flashcard" (
    "id" TEXT NOT NULL,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "noteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flashcard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "noteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "type" "QuizQuestionType" NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "correctAnswer" TEXT NOT NULL,
    "explanation" TEXT,
    "position" INTEGER NOT NULL,
    "quizId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "kind" "FileKind" NOT NULL DEFAULT 'SOURCE',
    "publicUrl" TEXT,
    "userId" TEXT NOT NULL,
    "noteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryLog" (
    "id" TEXT NOT NULL,
    "channel" "DeliveryChannel" NOT NULL DEFAULT 'WHATSAPP',
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "recipient" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "userId" TEXT NOT NULL,
    "noteId" TEXT,
    "generationJobId" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NoteSection_noteId_idx" ON "NoteSection"("noteId");

-- CreateIndex
CREATE UNIQUE INDEX "NoteSection_noteId_position_key" ON "NoteSection"("noteId", "position");

-- CreateIndex
CREATE INDEX "Flashcard_noteId_idx" ON "Flashcard"("noteId");

-- CreateIndex
CREATE UNIQUE INDEX "Flashcard_noteId_position_key" ON "Flashcard"("noteId", "position");

-- CreateIndex
CREATE INDEX "Quiz_noteId_idx" ON "Quiz"("noteId");

-- CreateIndex
CREATE UNIQUE INDEX "Quiz_noteId_position_key" ON "Quiz"("noteId", "position");

-- CreateIndex
CREATE INDEX "QuizQuestion_quizId_idx" ON "QuizQuestion"("quizId");

-- CreateIndex
CREATE UNIQUE INDEX "QuizQuestion_quizId_position_key" ON "QuizQuestion"("quizId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "File_storageKey_key" ON "File"("storageKey");

-- CreateIndex
CREATE INDEX "File_userId_idx" ON "File"("userId");

-- CreateIndex
CREATE INDEX "File_noteId_idx" ON "File"("noteId");

-- CreateIndex
CREATE INDEX "DeliveryLog_userId_idx" ON "DeliveryLog"("userId");

-- CreateIndex
CREATE INDEX "DeliveryLog_userId_channel_status_idx" ON "DeliveryLog"("userId", "channel", "status");

-- CreateIndex
CREATE INDEX "DeliveryLog_noteId_idx" ON "DeliveryLog"("noteId");

-- CreateIndex
CREATE INDEX "DeliveryLog_generationJobId_idx" ON "DeliveryLog"("generationJobId");

-- CreateIndex
CREATE INDEX "DeliveryLog_providerMessageId_idx" ON "DeliveryLog"("providerMessageId");

-- CreateIndex
CREATE INDEX "GenerationJob_userId_status_idx" ON "GenerationJob"("userId", "status");

-- CreateIndex
CREATE INDEX "GenerationJob_inputFileId_idx" ON "GenerationJob"("inputFileId");

-- CreateIndex
CREATE UNIQUE INDEX "Note_generationJobId_key" ON "Note"("generationJobId");

-- CreateIndex
CREATE INDEX "Note_userId_createdAt_idx" ON "Note"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_generationJobId_fkey" FOREIGN KEY ("generationJobId") REFERENCES "GenerationJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteSection" ADD CONSTRAINT "NoteSection_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_inputFileId_fkey" FOREIGN KEY ("inputFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flashcard" ADD CONSTRAINT "Flashcard_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryLog" ADD CONSTRAINT "DeliveryLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryLog" ADD CONSTRAINT "DeliveryLog_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryLog" ADD CONSTRAINT "DeliveryLog_generationJobId_fkey" FOREIGN KEY ("generationJobId") REFERENCES "GenerationJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;
