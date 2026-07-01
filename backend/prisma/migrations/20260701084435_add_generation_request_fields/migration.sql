-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('SCHOOL', 'COLLEGE', 'UNIVERSITY', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "GenerationLanguage" AS ENUM ('ENGLISH', 'URDU');

-- CreateEnum
CREATE TYPE "NotesLength" AS ENUM ('SHORT', 'MEDIUM', 'LONG');

-- AlterTable
ALTER TABLE "GenerationJob" ADD COLUMN     "educationLevel" "EducationLevel" NOT NULL DEFAULT 'UNIVERSITY',
ADD COLUMN     "includePracticalExamples" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "language" "GenerationLanguage" NOT NULL DEFAULT 'ENGLISH',
ADD COLUMN     "notesLength" "NotesLength" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "numberOfFlashcards" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "numberOfMcqs" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "sendToWhatsapp" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subject" TEXT NOT NULL DEFAULT 'General';
