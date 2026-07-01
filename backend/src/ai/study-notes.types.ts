export interface StudyNotesGenerationInput {
  topic: string;
  subject: string;
  educationLevel: 'SCHOOL' | 'COLLEGE' | 'UNIVERSITY' | 'PROFESSIONAL';
  language: 'ENGLISH' | 'URDU';
  notesLength: 'SHORT' | 'MEDIUM' | 'LONG';
  numberOfMcqs: number;
  numberOfFlashcards: number;
  includePracticalExamples: boolean;
}
