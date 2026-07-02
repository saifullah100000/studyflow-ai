import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createGeneratedStudyNotesSchema } from '../ai/schemas/study-notes.schema';
import { PrismaService } from '../prisma/prisma.service';
import type {
  N8nCompletedCallbackDto,
  N8nFailedCallbackDto,
  N8nProcessingCallbackDto,
} from './dto/n8n-callback.dto';

@Injectable()
export class N8nCallbacksService {
  constructor(private readonly prisma: PrismaService) {}

  async markProcessing(callbackDto: N8nProcessingCallbackDto) {
    const job = await this.findAndVerifyJob(
      callbackDto.jobId,
      callbackDto.requestId,
    );

    if (job.status === 'COMPLETED' || job.status === 'FAILED') {
      return {
        acknowledged: true,
        status: job.status,
        jobId: job.id,
        requestId: callbackDto.requestId,
        ignored: true,
      };
    }

    const updatedJob = await this.prisma.generationJob.update({
      where: {
        id: job.id,
      },
      data: {
        status: 'PROCESSING',
        startedAt: job.startedAt ?? new Date(),
        errorMessage: null,
      },
      select: {
        id: true,
        status: true,
        startedAt: true,
      },
    });

    return {
      acknowledged: true,
      status: updatedJob.status,
      jobId: updatedJob.id,
      requestId: callbackDto.requestId,
    };
  }

  async complete(callbackDto: N8nCompletedCallbackDto) {
    const job = await this.findAndVerifyJob(
      callbackDto.jobId,
      callbackDto.requestId,
    );

    if (job.status === 'COMPLETED') {
      const existingNote = await this.prisma.note.findUnique({
        where: {
          generationJobId: job.id,
        },
        select: {
          id: true,
        },
      });

      return {
        acknowledged: true,
        status: 'COMPLETED' as const,
        jobId: job.id,
        requestId: callbackDto.requestId,
        noteId: existingNote?.id,
        alreadyProcessed: true,
      };
    }

    if (job.status === 'FAILED') {
      throw new ConflictException('This generation job has already failed');
    }

    const schema = createGeneratedStudyNotesSchema(
      job.numberOfMcqs,
      job.numberOfFlashcards,
    );

    const validationResult = schema.safeParse(callbackDto.output);

    if (!validationResult.success) {
      await this.prisma.generationJob.update({
        where: {
          id: job.id,
        },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: 'n8n returned malformed structured output',
        },
      });

      throw new BadRequestException(
        'Generated output failed backend validation',
      );
    }

    const generatedNotes = validationResult.data;

    const result = await this.prisma.$transaction(async (transaction) => {
      const note = await transaction.note.create({
        data: {
          title: generatedNotes.title,
          topic: job.subject,
          introduction: generatedNotes.introduction,
          learningObjectives: generatedNotes.learningObjectives,
          summary: generatedNotes.summary,
          content: null,

          userId: job.userId,
          generationJobId: job.id,

          sections: {
            create: generatedNotes.sections.map((section, index) => ({
              heading: section.heading,
              content: section.content,
              position: index,
            })),
          },

          ...(generatedNotes.flashcards.length > 0
            ? {
                flashcards: {
                  create: generatedNotes.flashcards.map((flashcard, index) => ({
                    front: flashcard.front,
                    back: flashcard.back,
                    position: index,
                  })),
                },
              }
            : {}),

          ...(generatedNotes.mcqs.length > 0
            ? {
                quizzes: {
                  create: {
                    title: `${generatedNotes.title} Quiz`,
                    description: `Assessment questions for ${generatedNotes.title}`,
                    position: 0,

                    questions: {
                      create: generatedNotes.mcqs.map((mcq, index) => ({
                        question: mcq.question,
                        type: 'MULTIPLE_CHOICE',
                        options: mcq.options,
                        correctAnswer: mcq.correctAnswer,
                        explanation: mcq.explanation,
                        position: index,
                      })),
                    },
                  },
                },
              }
            : {}),
        },
        select: {
          id: true,
          title: true,
        },
      });

      const completedJob = await transaction.generationJob.update({
        where: {
          id: job.id,
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          errorMessage: null,
        },
        select: {
          id: true,
          status: true,
          completedAt: true,
        },
      });

      return {
        note,
        job: completedJob,
      };
    });

    return {
      acknowledged: true,
      status: 'COMPLETED' as const,
      jobId: result.job.id,
      requestId: callbackDto.requestId,
      noteId: result.note.id,
      title: result.note.title,
    };
  }

  async fail(callbackDto: N8nFailedCallbackDto) {
    const job = await this.findAndVerifyJob(
      callbackDto.jobId,
      callbackDto.requestId,
    );

    if (job.status === 'COMPLETED') {
      return {
        acknowledged: true,
        status: 'COMPLETED' as const,
        jobId: job.id,
        requestId: callbackDto.requestId,
        ignored: true,
      };
    }

    const failedJob = await this.prisma.generationJob.update({
      where: {
        id: job.id,
      },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorMessage: callbackDto.errorMessage.slice(0, 1000),
      },
      select: {
        id: true,
        status: true,
        errorMessage: true,
      },
    });

    return {
      acknowledged: true,
      status: failedJob.status,
      jobId: failedJob.id,
      requestId: callbackDto.requestId,
      message: failedJob.errorMessage,
    };
  }

  private async findAndVerifyJob(jobId: string, requestId: string) {
    const job = await this.prisma.generationJob.findUnique({
      where: {
        id: jobId,
      },
      select: {
        id: true,
        userId: true,
        subject: true,
        status: true,
        startedAt: true,
        numberOfMcqs: true,
        numberOfFlashcards: true,
        automationRequestId: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Generation job not found');
    }

    if (job.automationRequestId !== requestId) {
      throw new ConflictException(
        'Callback request does not match the generation job',
      );
    }

    return job;
  }
}
