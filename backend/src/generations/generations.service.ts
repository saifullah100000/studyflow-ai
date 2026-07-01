import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGenerationDto } from './dto/create-generation.dto';

@Injectable()
export class GenerationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createGenerationDto: CreateGenerationDto) {
    const prompt = this.buildPrompt(createGenerationDto);

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
        createdAt: true,
      },
    });

    return {
      message: 'Generation request created successfully',
      job,
    };
  }

  private buildPrompt(request: CreateGenerationDto): string {
    const examplesInstruction = request.includePracticalExamples
      ? 'Include practical and real-world examples.'
      : 'Practical examples are not required.';

    return [
      `Create ${request.notesLength.toLowerCase()} study notes.`,
      `Topic: ${request.topic}`,
      `Subject: ${request.subject}`,
      `Education level: ${request.educationLevel.toLowerCase()}`,
      `Language: ${request.language.toLowerCase()}`,
      `Generate ${request.numberOfMcqs} MCQs.`,
      `Generate ${request.numberOfFlashcards} flashcards.`,
      examplesInstruction,
      'Organize the content using clear headings and sections.',
    ].join('\n');
  }
}
