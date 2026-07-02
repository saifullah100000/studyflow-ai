export interface NoteCount {
  sections: number;
  flashcards: number;
  quizzes: number;
  files: number;
}

export interface NoteListItem {
  id: string;
  title: string;
  topic: string | null;
  summary: string | null;
  generationJobId: string | null;
  createdAt: string;
  updatedAt: string;
  _count: NoteCount;
}

export interface NotesPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface NotesListResponse {
  data: NoteListItem[];
  pagination: NotesPagination;
}

export interface NoteSection {
  id: string;
  heading: string;
  content: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  position: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type:
    | "MULTIPLE_CHOICE"
    | "TRUE_FALSE"
    | "SHORT_ANSWER";
  options: string[];
  correctAnswer: string;
  explanation: string | null;
  position: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  position: number;
  questions: QuizQuestion[];
}

export interface NoteFile {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  kind:
    | "SOURCE"
    | "GENERATED_PDF"
    | "GENERATED_DOCX"
    | "OTHER";
  publicUrl: string | null;
  createdAt: string;
}

export interface NoteDetails {
  id: string;
  title: string;
  topic: string | null;
  introduction: string | null;
  learningObjectives: string[];
  summary: string | null;
  content: string | null;
  userId: string;
  generationJobId: string | null;
  createdAt: string;
  updatedAt: string;
  sections: NoteSection[];
  flashcards: Flashcard[];
  quizzes: Quiz[];
  files: NoteFile[];
}