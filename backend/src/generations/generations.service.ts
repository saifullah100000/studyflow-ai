import {
  BadGatewayException,
  HttpException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { N8nService } from '../n8n/n8n.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGenerationDto } from './dto/create-generation.dto';

@Injectable()
export class GenerationsService {
  private readonly logger = new Logger(GenerationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly n8nService: N8nService,
  ) {}

  async create(userId: string, createGenerationDto: CreateGenerationDto) {
    const requestId = randomUUID();

    const job = await this.prisma.generationJob.create({
      data: {
        topic: createGenerationDto.topic,
        subject: createGenerationDto.subject,
        educationLevel: createGenerationDto.educationLevel,
        language: createGenerationDto.language,
        notesLength: createGenerationDto.notesLength,
        numberOfMcqs: createGenerationDto.numberOfMcqs,
        numberOfFlashcards: createGenerationDto.numberOfFlashcards,
        includePracticalExamples: createGenerationDto.includePracticalExamples,
        sendToWhatsapp: createGenerationDto.sendToWhatsapp,
        status: 'PENDING',
        userId,
        automationRequestId: requestId,
        prompt: this.buildPromptSummary(createGenerationDto),
      },
      select: {
        id: true,
      },
    });

    try {
      const automation = await this.n8nService.sendGenerationRequest({
        event: 'generation.requested',
        requestId,
        occurredAt: new Date().toISOString(),
        jobId: job.id,
        userId,

        generation: {
          topic: createGenerationDto.topic,
          subject: createGenerationDto.subject,
          educationLevel: createGenerationDto.educationLevel,
          language: createGenerationDto.language,
          notesLength: createGenerationDto.notesLength,
          numberOfMcqs: createGenerationDto.numberOfMcqs,
          numberOfFlashcards: createGenerationDto.numberOfFlashcards,
          includePracticalExamples:
            createGenerationDto.includePracticalExamples,
          sendToWhatsapp: createGenerationDto.sendToWhatsapp,
        },
      });

      const completedJob = await this.prisma.generationJob.findFirst({
        where: {
          id: job.id,
          userId,
        },
        include: {
          note: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      if (
        !completedJob ||
        completedJob.status !== 'COMPLETED' ||
        !completedJob.note
      ) {
        throw new BadGatewayException(
          'n8n finished without completing the generation job',
        );
      }

      return {
        message: 'Study notes generated successfully through n8n',
        automation,
        job: completedJob,
        note: completedJob.note,
      };
    } catch (error: unknown) {
      await this.markFailedIfNecessary(job.id, error);

      throw error;
    }
  }

  private buildPromptSummary(request: CreateGenerationDto): string {
    return [
      `Topic: ${request.topic}`,
      `Subject: ${request.subject}`,
      `Education level: ${request.educationLevel}`,
      `Language: ${request.language}`,
      `Length: ${request.notesLength}`,
      `MCQs: ${request.numberOfMcqs}`,
      `Flashcards: ${request.numberOfFlashcards}`,
      `Practical examples: ${request.includePracticalExamples}`,
    ].join('\n');
  }

  private async markFailedIfNecessary(
    jobId: string,
    error: unknown,
  ): Promise<void> {
    const message =
      error instanceof HttpException
        ? this.extractHttpMessage(error)
        : 'n8n generation workflow failed';

    try {
      await this.prisma.generationJob.updateMany({
        where: {
          id: jobId,
          status: {
            not: 'COMPLETED',
          },
        },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: message.slice(0, 1000),
        },
      });
    } catch (databaseError: unknown) {
      this.logger.error(
        databaseError instanceof Error
          ? databaseError.message
          : 'Could not update failed generation job',
      );
    }
  }

  private extractHttpMessage(error: HttpException): string {
    const response = error.getResponse();

    if (typeof response === 'string') {
      return response;
    }

    if (
      typeof response === 'object' &&
      response !== null &&
      'message' in response
    ) {
      const message = (response as { message?: unknown }).message;

      if (typeof message === 'string') {
        return message;
      }

      if (Array.isArray(message)) {
        return message
          .filter((item): item is string => typeof item === 'string')
          .join(', ');
      }
    }

    return error.message;
  }
}
