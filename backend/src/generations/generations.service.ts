import { HttpException, Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import type { StudyNotesGenerationInput } from '../ai/study-notes.types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGenerationDto } from './dto/create-generation.dto';

const publicGenerationJobSelect = {
  id: true,
  topic: true,
  subject: true,
  educationLevel: true,
  language: true,
  notesLength: true,
  numberOfMcqs: true,
  numberOfFlashcards: true,
  includePracticalExamples: true,
  sendToWhatsapp: true,
  status: true,
  startedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class GenerationsService {
  private readonly logger = new Logger(GenerationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async create(userId: string, createGenerationDto: CreateGenerationDto) {
    const aiInput: StudyNotesGenerationInput = {
      topic: createGenerationDto.topic,
      subject: createGenerationDto.subject,
      educationLevel: createGenerationDto.educationLevel,
      language: createGenerationDto.language,
      notesLength: createGenerationDto.notesLength,
      numberOfMcqs: createGenerationDto.numberOfMcqs,
      numberOfFlashcards: createGenerationDto.numberOfFlashcards,
      includePracticalExamples: createGenerationDto.includePracticalExamples,
    };

    const prompt = this.aiService.buildStudyNotesPrompt(aiInput);

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
        prompt,
        status: 'PENDING',
        userId,
      },
      select: {
        id: true,
      },
    });

    try {
      await this.prisma.generationJob.update({
        where: {
          id: job.id,
        },
        data: {
          status: 'PROCESSING',
          startedAt: new Date(),
          errorMessage: null,
        },
      });

      const generatedNotes = await this.aiService.generateStudyNotes(
        aiInput,
        prompt,
      );

      const result = await this.prisma.$transaction(async (transaction) => {
        const note = await transaction.note.create({
          data: {
            title: generatedNotes.title,
            topic: createGenerationDto.subject,
            summary: generatedNotes.summary,
            content: generatedNotes.content,
            userId,
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
                    create: generatedNotes.flashcards.map(
                      (flashcard, index) => ({
                        front: flashcard.front,
                        back: flashcard.back,
                        position: index,
                      }),
                    ),
                  },
                }
              : {}),

            ...(generatedNotes.quiz.questions.length > 0
              ? {
                  quizzes: {
                    create: {
                      title: generatedNotes.quiz.title,
                      description: generatedNotes.quiz.description,
                      position: 0,

                      questions: {
                        create: generatedNotes.quiz.questions.map(
                          (question, index) => ({
                            question: question.question,
                            type: 'MULTIPLE_CHOICE',
                            options: question.options,
                            correctAnswer: question.correctAnswer,
                            explanation: question.explanation,
                            position: index,
                          }),
                        ),
                      },
                    },
                  },
                }
              : {}),
          },

          include: {
            sections: {
              orderBy: {
                position: 'asc',
              },
            },

            flashcards: {
              orderBy: {
                position: 'asc',
              },
            },

            quizzes: {
              orderBy: {
                position: 'asc',
              },
              include: {
                questions: {
                  orderBy: {
                    position: 'asc',
                  },
                },
              },
            },
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
          select: publicGenerationJobSelect,
        });

        return {
          job: completedJob,
          note,
        };
      });

      return {
        message: 'Study notes generated successfully',
        ...result,
      };
    } catch (error: unknown) {
      await this.markJobAsFailed(job.id, error);

      throw error;
    }
  }

  private async markJobAsFailed(jobId: string, error: unknown): Promise<void> {
    const errorMessage = this.getSafeFailureMessage(error);

    try {
      await this.prisma.generationJob.update({
        where: {
          id: jobId,
        },
        data: {
          status: 'FAILED',
          errorMessage,
          completedAt: new Date(),
        },
      });
    } catch (databaseError: unknown) {
      this.logger.error(
        `Could not mark generation job ${jobId} as failed: ${
          databaseError instanceof Error
            ? databaseError.message
            : 'Unknown database error'
        }`,
      );
    }
  }

  private getSafeFailureMessage(error: unknown): string {
    if (error instanceof HttpException) {
      const response = error.getResponse();

      if (typeof response === 'string') {
        return response.slice(0, 1000);
      }

      if (
        typeof response === 'object' &&
        response !== null &&
        'message' in response
      ) {
        const message = (
          response as {
            message?: unknown;
          }
        ).message;

        if (typeof message === 'string') {
          return message.slice(0, 1000);
        }
      }
    }

    return 'AI generation failed';
  }
}
