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
  createGeneratedStudyNotesSchema,
  type GeneratedStudyNotes,
} from './schemas/study-notes.schema';
import type { StudyNotesGenerationInput } from './study-notes.types';

class StructuredOutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StructuredOutputError';
  }
}

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
  private readonly maxAttempts: number;
  private readonly retryBaseDelayMs: number;

  constructor(private readonly configService: ConfigService) {
    this.client = new GoogleGenAI({
      apiKey: this.configService.getOrThrow<string>('GEMINI_API_KEY'),
    });

    this.model =
      this.configService.get<string>('GEMINI_MODEL') ?? 'gemini-3.5-flash';

    this.timeoutMs = this.readPositiveInteger(
      'GEMINI_TIMEOUT_MS',
      120000,
      1000,
      300000,
    );

    this.maxAttempts = this.readPositiveInteger('GEMINI_MAX_ATTEMPTS', 3, 1, 5);

    this.retryBaseDelayMs = this.readPositiveInteger(
      'GEMINI_RETRY_BASE_DELAY_MS',
      800,
      100,
      10000,
    );
  }

  buildStudyNotesPrompt(input: StudyNotesGenerationInput): string {
    const language = input.language === 'URDU' ? 'Urdu' : 'English';

    const lengthInstructions: Record<
      StudyNotesGenerationInput['notesLength'],
      string
    > = {
      SHORT: 'Create concise notes focused on essential concepts.',
      MEDIUM: 'Create moderately detailed notes with clear explanations.',
      LONG: 'Create comprehensive notes covering the topic thoroughly.',
    };

    const examplesInstruction = input.includePracticalExamples
      ? 'Include practical and real-world examples in relevant sections.'
      : 'Do not include unnecessary practical examples.';

    return [
      'You are StudyFlow AI, an educational notes generator.',
      '',
      `Topic: ${input.topic}`,
      `Subject: ${input.subject}`,
      `Education level: ${input.educationLevel.toLowerCase()}`,
      `Language: ${language}`,
      '',
      lengthInstructions[input.notesLength],
      examplesInstruction,
      '',
      'Required quality rules:',
      '- Use accurate, student-friendly explanations.',
      '- Organize sections in a logical learning order.',
      '- Return between 3 and 8 learning objectives.',
      `- Return exactly ${input.numberOfMcqs} MCQs.`,
      `- Return exactly ${input.numberOfFlashcards} flashcards.`,
      '- Each MCQ must have exactly four unique options.',
      '- correctAnswer must exactly match one option.',
      '- Each MCQ must include an explanation.',
      '- Avoid unsupported citations and invented statistics.',
      '- Return only the structured response requested by the schema.',
    ].join('\n');
  }

  async generateStudyNotes(
    input: StudyNotesGenerationInput,
    basePrompt = this.buildStudyNotesPrompt(input),
  ): Promise<GeneratedStudyNotes> {
    let lastError: unknown = new Error('AI generation failed');

    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      try {
        return await this.requestStructuredNotes(input, basePrompt, attempt);
      } catch (error: unknown) {
        lastError = error;

        const canRetry =
          this.isRetryableError(error) && attempt < this.maxAttempts;

        if (!canRetry) {
          break;
        }

        const delayMs = this.calculateRetryDelay(attempt);

        this.logger.warn(
          `Gemini attempt ${attempt} failed. Retrying in ${delayMs}ms.`,
        );

        await this.delay(delayMs);
      }
    }

    this.throwFinalError(lastError);
  }

  private async requestStructuredNotes(
    input: StudyNotesGenerationInput,
    basePrompt: string,
    attempt: number,
  ): Promise<GeneratedStudyNotes> {
    const retryInstruction =
      attempt === 1
        ? ''
        : [
            '',
            'IMPORTANT RETRY INSTRUCTION:',
            'The previous response failed validation.',
            'Return every required property with the exact requested counts.',
            'Return no Markdown, explanations or text outside the JSON response.',
          ].join('\n');

    const interaction = await this.withTimeout(
      this.client.interactions.create({
        model: this.model,
        input: `${basePrompt}${retryInstruction}`,

        generation_config: {
          thinking_level: 'minimal',
          thinking_summaries: 'none',
          temperature: 0.2,
          max_output_tokens: this.getMaxOutputTokens(input.notesLength),
        },

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
      throw new StructuredOutputError('Gemini returned an empty response');
    }

    let parsedResponse: unknown;

    try {
      parsedResponse = JSON.parse(outputText);
    } catch {
      throw new StructuredOutputError('Gemini returned malformed JSON');
    }

    const schema = createGeneratedStudyNotesSchema(
      input.numberOfMcqs,
      input.numberOfFlashcards,
    );

    const validationResult = schema.safeParse(parsedResponse);

    if (!validationResult.success) {
      this.logger.warn(
        `Structured output validation failed: ${JSON.stringify(
          validationResult.error.issues,
        )}`,
      );

      throw new StructuredOutputError(
        'Gemini returned an invalid response structure',
      );
    }

    return validationResult.data;
  }

  private isRetryableError(error: unknown): boolean {
    if (
      error instanceof StructuredOutputError ||
      error instanceof GeminiTimeoutError
    ) {
      return true;
    }

    const status = this.getProviderStatus(error);

    return status === 429 || status === 500 || status === 503 || status === 504;
  }

  private calculateRetryDelay(attempt: number): number {
    const exponentialDelay = this.retryBaseDelayMs * 2 ** (attempt - 1);

    const randomJitter = Math.floor(Math.random() * 250);

    return exponentialDelay + randomJitter;
  }

  private getMaxOutputTokens(
    notesLength: StudyNotesGenerationInput['notesLength'],
  ): number {
    switch (notesLength) {
      case 'SHORT':
        return 6000;

      case 'MEDIUM':
        return 10000;

      case 'LONG':
        return 16000;
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

  private throwFinalError(error: unknown): never {
    if (error instanceof StructuredOutputError) {
      throw new BadGatewayException(
        'Gemini could not produce a valid structured response',
      );
    }

    if (error instanceof GeminiTimeoutError) {
      throw new GatewayTimeoutException(
        'AI generation took too long. Please try again.',
      );
    }

    const status = this.getProviderStatus(error);

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

    if (status === 504) {
      throw new GatewayTimeoutException(
        'Gemini could not complete the request in time',
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

    const nestedError =
      typeof errorRecord.error === 'object' && errorRecord.error !== null
        ? (errorRecord.error as Record<string, unknown>)
        : undefined;

    const possibleStatuses = [
      errorRecord.status,
      errorRecord.statusCode,
      errorRecord.code,
      nestedError?.status,
      nestedError?.code,
    ];

    for (const possibleStatus of possibleStatuses) {
      if (typeof possibleStatus === 'number') {
        return possibleStatus;
      }

      if (typeof possibleStatus === 'string' && /^\d+$/.test(possibleStatus)) {
        return Number(possibleStatus);
      }

      if (typeof possibleStatus === 'string') {
        const statusMap: Record<string, number> = {
          INVALID_ARGUMENT: 400,
          PERMISSION_DENIED: 403,
          RESOURCE_EXHAUSTED: 429,
          INTERNAL: 500,
          UNAVAILABLE: 503,
          DEADLINE_EXCEEDED: 504,
        };

        const mappedStatus = statusMap[possibleStatus.toUpperCase()];

        if (mappedStatus) {
          return mappedStatus;
        }
      }
    }

    return undefined;
  }

  private readPositiveInteger(
    environmentVariable: string,
    fallback: number,
    minimum: number,
    maximum: number,
  ): number {
    const configuredValue = Number(
      this.configService.get<string>(environmentVariable) ?? fallback,
    );

    if (
      !Number.isInteger(configuredValue) ||
      configuredValue < minimum ||
      configuredValue > maximum
    ) {
      return fallback;
    }

    return configuredValue;
  }

  private delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }
}
