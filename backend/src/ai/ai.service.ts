import {
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import {
  buildStudyNotesJsonSchema,
  generatedStudyNotesSchema,
  type GeneratedStudyNotes,
} from './schemas/study-notes.schema';
import type { StudyNotesGenerationInput } from './study-notes.types';

class GeminiTimeoutError extends Error {
  constructor() {
    super('Gemini request timed out');
    this.name = 'GeminiTimeoutError';
  }
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: GoogleGenAI;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('GEMINI_API_KEY');

    this.model =
      this.configService.get<string>('GEMINI_MODEL') ?? 'gemini-3.5-flash';

    const configuredTimeout = Number(
      this.configService.get<string>('GEMINI_TIMEOUT_MS') ?? 120000,
    );

    this.timeoutMs =
      Number.isFinite(configuredTimeout) && configuredTimeout >= 1000
        ? configuredTimeout
        : 120000;

    this.client = new GoogleGenAI({
      apiKey,
    });
  }

  buildStudyNotesPrompt(input: StudyNotesGenerationInput): string {
    const language = input.language === 'URDU' ? 'Urdu' : 'English';

    const lengthInstruction: Record<
      StudyNotesGenerationInput['notesLength'],
      string
    > = {
      SHORT: 'Keep the notes concise and focused on the essential concepts.',
      MEDIUM: 'Create moderately detailed notes with clear explanations.',
      LONG: 'Create comprehensive and detailed notes covering the topic thoroughly.',
    };

    const practicalExamplesInstruction = input.includePracticalExamples
      ? 'Include practical, real-world examples wherever useful.'
      : 'Do not add unnecessary practical examples.';

    return [
      'You are StudyFlow AI, an educational content generator.',
      '',
      `Create accurate study notes about: ${input.topic}`,
      `Subject: ${input.subject}`,
      `Education level: ${input.educationLevel.toLowerCase()}`,
      `Output language: ${language}`,
      '',
      lengthInstruction[input.notesLength],
      practicalExamplesInstruction,
      '',
      'Requirements:',
      '- Use clear headings and logically ordered sections.',
      '- Explain difficult terminology in student-friendly language.',
      '- Keep the content appropriate for the selected education level.',
      `- Generate exactly ${input.numberOfFlashcards} flashcards.`,
      `- Generate exactly ${input.numberOfMcqs} multiple-choice questions.`,
      '- Each MCQ must have exactly four options.',
      '- The correctAnswer must exactly match one option.',
      '- Every MCQ must include a brief explanation.',
      '- Avoid invented references, statistics or citations.',
      '- Follow the supplied response schema.',
    ].join('\n');
  }

  async generateStudyNotes(
    input: StudyNotesGenerationInput,
    prompt = this.buildStudyNotesPrompt(input),
  ): Promise<GeneratedStudyNotes> {
    try {
      const interaction = await this.withTimeout(
        this.client.interactions.create({
          model: this.model,
          input: prompt,
          response_format: {
            type: 'text',
            mime_type: 'application/json',
            schema: buildStudyNotesJsonSchema(
              input.numberOfMcqs,
              input.numberOfFlashcards,
            ),
          },
        }),
      );

      const outputText = interaction.output_text;

      if (typeof outputText !== 'string' || outputText.trim().length === 0) {
        throw new BadGatewayException('Gemini returned an empty response');
      }

      let parsedJson: unknown;

      try {
        parsedJson = JSON.parse(outputText);
      } catch {
        this.logger.error(
          'Gemini returned content that could not be parsed as JSON',
        );

        throw new BadGatewayException('Gemini returned invalid JSON');
      }

      const result = generatedStudyNotesSchema.safeParse(parsedJson);

      if (!result.success) {
        this.logger.error(
          `Gemini schema validation failed: ${JSON.stringify(
            result.error.issues,
          )}`,
        );

        throw new BadGatewayException(
          'Gemini returned an invalid notes structure',
        );
      }

      this.validateGeneratedCounts(result.data, input);
      this.validateCorrectAnswers(result.data);

      return result.data;
    } catch (error: unknown) {
      this.handleGeminiError(error);
    }
  }

  private validateGeneratedCounts(
    notes: GeneratedStudyNotes,
    input: StudyNotesGenerationInput,
  ): void {
    if (notes.flashcards.length !== input.numberOfFlashcards) {
      throw new BadGatewayException(
        'Gemini returned an incorrect number of flashcards',
      );
    }

    if (notes.quiz.questions.length !== input.numberOfMcqs) {
      throw new BadGatewayException(
        'Gemini returned an incorrect number of MCQs',
      );
    }
  }

  private validateCorrectAnswers(notes: GeneratedStudyNotes): void {
    const invalidQuestion = notes.quiz.questions.find(
      (question) => !question.options.includes(question.correctAnswer),
    );

    if (invalidQuestion) {
      throw new BadGatewayException(
        'Gemini returned an MCQ with an invalid correct answer',
      );
    }
  }

  private async withTimeout<T>(operation: Promise<T>): Promise<T> {
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new GeminiTimeoutError());
      }, this.timeoutMs);
    });

    try {
      return await Promise.race([operation, timeoutPromise]);
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  private handleGeminiError(error: unknown): never {
    if (error instanceof HttpException) {
      throw error;
    }

    if (error instanceof GeminiTimeoutError) {
      this.logger.error(`Gemini request exceeded ${this.timeoutMs}ms`);

      throw new GatewayTimeoutException(
        'AI generation took too long. Please try again.',
      );
    }

    const status = this.getProviderStatus(error);

    this.logger.error(
      `Gemini request failed${
        status ? ` with status ${status}` : ''
      }: ${this.getErrorMessage(error)}`,
    );

    if (status === 401 || status === 403) {
      throw new ServiceUnavailableException(
        'AI service credentials are invalid or unavailable',
      );
    }

    if (status === 429) {
      throw new HttpException(
        'Gemini rate limit reached. Please try again shortly.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (status === 500 || status === 503) {
      throw new ServiceUnavailableException(
        'Gemini is temporarily unavailable. Please try again.',
      );
    }

    if (status === 400) {
      throw new BadGatewayException('Gemini rejected the generation request');
    }

    throw new BadGatewayException('AI generation failed');
  }

  private getProviderStatus(error: unknown): number | undefined {
    if (typeof error !== 'object' || error === null) {
      return undefined;
    }

    const errorRecord = error as Record<string, unknown>;

    const possibleStatus =
      errorRecord.status ?? errorRecord.statusCode ?? errorRecord.code;

    if (typeof possibleStatus === 'number') {
      return possibleStatus;
    }

    if (typeof possibleStatus === 'string' && /^\d+$/.test(possibleStatus)) {
      return Number(possibleStatus);
    }

    return undefined;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown Gemini error';
  }
}
