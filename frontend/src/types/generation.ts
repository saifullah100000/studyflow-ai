export type EducationLevel =
  | "SCHOOL"
  | "COLLEGE"
  | "UNIVERSITY"
  | "PROFESSIONAL";

export type GenerationLanguage =
  | "ENGLISH"
  | "URDU";

export type NotesLength =
  | "SHORT"
  | "MEDIUM"
  | "LONG";

export interface GenerationFormData {
  topic: string;
  subject: string;
  educationLevel: EducationLevel;
  language: GenerationLanguage;
  notesLength: NotesLength;
  numberOfMcqs: number;
  numberOfFlashcards: number;
  includePracticalExamples: boolean;
  sendToWhatsapp: boolean;
}

export interface GenerationJob {
  id: string;
  topic: string;
  subject: string;
  educationLevel: EducationLevel;
  language: GenerationLanguage;
  notesLength: NotesLength;
  numberOfMcqs: number;
  numberOfFlashcards: number;
  includePracticalExamples: boolean;
  sendToWhatsapp: boolean;
  status:
    | "PENDING"
    | "PROCESSING"
    | "COMPLETED"
    | "FAILED";
  createdAt: string;
}

export interface CreateGenerationResponse {
  message: string;
  job: GenerationJob;
}