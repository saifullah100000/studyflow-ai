-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "introduction" TEXT,
ADD COLUMN     "learningObjectives" TEXT[] DEFAULT ARRAY[]::TEXT[];
