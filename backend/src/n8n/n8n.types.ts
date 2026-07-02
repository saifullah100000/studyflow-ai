export interface N8nGenerationPayload {
  event: 'generation.requested';
  requestId: string;
  occurredAt: string;
  jobId: string;
  userId: string;

  generation: {
    topic: string;
    subject: string;
    educationLevel: string;
    language: string;
    notesLength: string;
    numberOfMcqs: number;
    numberOfFlashcards: number;
    includePracticalExamples: boolean;
    sendToWhatsapp: boolean;
  };
}

export interface N8nDispatchResult {
  accepted: boolean;
  skipped: boolean;
  message: string;
  jobId: string;
  requestId?: string;
  event?: string;
  receivedAt?: string;
}
