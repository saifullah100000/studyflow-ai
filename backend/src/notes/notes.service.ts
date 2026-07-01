import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { ListNotesQueryDto } from './dto/list-notes-query.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

const noteDetailsInclude = {
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

  files: {
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true,
      kind: true,
      publicUrl: true,
      createdAt: true,
    },
  },
} satisfies Prisma.NoteInclude;

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createNoteDto: CreateNoteDto) {
    return this.prisma.note.create({
      data: {
        title: createNoteDto.title,

        ...(createNoteDto.topic !== undefined
          ? {
              topic: createNoteDto.topic,
            }
          : {}),

        ...(createNoteDto.summary !== undefined
          ? {
              summary: createNoteDto.summary,
            }
          : {}),

        ...(createNoteDto.content !== undefined
          ? {
              content: createNoteDto.content,
            }
          : {}),

        user: {
          connect: {
            id: userId,
          },
        },

        ...(createNoteDto.sections?.length
          ? {
              sections: {
                create: createNoteDto.sections.map((section, index) => ({
                  heading: section.heading,
                  content: section.content,
                  position: index,
                })),
              },
            }
          : {}),
      },

      include: noteDetailsInclude,
    });
  }

  async findAll(userId: string, query: ListNotesQueryDto) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const where: Prisma.NoteWhereInput = {
      userId,
    };

    if (query.title) {
      where.title = {
        contains: query.title,
        mode: 'insensitive',
      };
    }

    if (query.subject) {
      where.topic = {
        contains: query.subject,
        mode: 'insensitive',
      };
    }

    const [notes, total] = await this.prisma.$transaction([
      this.prisma.note.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          updatedAt: 'desc',
        },
        select: {
          id: true,
          title: true,
          topic: true,
          summary: true,
          generationJobId: true,
          createdAt: true,
          updatedAt: true,

          _count: {
            select: {
              sections: true,
              flashcards: true,
              quizzes: true,
              files: true,
            },
          },
        },
      }),

      this.prisma.note.count({
        where,
      }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data: notes,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1 && totalPages > 0,
      },
    };
  }

  async findOne(userId: string, noteId: string) {
    const note = await this.prisma.note.findFirst({
      where: {
        id: noteId,
        userId,
      },
      include: noteDetailsInclude,
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    return note;
  }

  async update(userId: string, noteId: string, updateNoteDto: UpdateNoteDto) {
    return this.prisma.$transaction(async (transaction) => {
      const existingNote = await transaction.note.findFirst({
        where: {
          id: noteId,
          userId,
        },
        select: {
          id: true,
        },
      });

      if (!existingNote) {
        throw new NotFoundException('Note not found');
      }

      await transaction.note.update({
        where: {
          id: noteId,
        },
        data: {
          ...(updateNoteDto.title !== undefined
            ? {
                title: updateNoteDto.title,
              }
            : {}),

          ...(updateNoteDto.topic !== undefined
            ? {
                topic: updateNoteDto.topic,
              }
            : {}),

          ...(updateNoteDto.summary !== undefined
            ? {
                summary: updateNoteDto.summary,
              }
            : {}),

          ...(updateNoteDto.content !== undefined
            ? {
                content: updateNoteDto.content,
              }
            : {}),
        },
      });

      if (updateNoteDto.sections !== undefined) {
        await transaction.noteSection.deleteMany({
          where: {
            noteId,
          },
        });

        if (updateNoteDto.sections.length > 0) {
          await transaction.noteSection.createMany({
            data: updateNoteDto.sections.map((section, index) => ({
              noteId,
              heading: section.heading,
              content: section.content,
              position: index,
            })),
          });
        }
      }

      return transaction.note.findUniqueOrThrow({
        where: {
          id: noteId,
        },
        include: noteDetailsInclude,
      });
    });
  }

  async remove(userId: string, noteId: string): Promise<void> {
    const result = await this.prisma.note.deleteMany({
      where: {
        id: noteId,
        userId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Note not found');
    }
  }
}
