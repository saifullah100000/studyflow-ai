import { z } from 'zod';

const sectionSchema = z
  .object({
    heading: z.string().trim().min(1).max(200),
    content: z.string().trim().min(1).max(30000),
  })
  .strict();

const mcqSchema = z
  .object({
    question: z.string().trim().min(1).max(1000),

    options: z.array(z.string().trim().min(1).max(500)).length(4),

    correctAnswer: z.string().trim().min(1).max(500),

    explanation: z.string().trim().min(1).max(3000),
  })
  .strict();

const flashcardSchema = z
  .object({
    front: z.string().trim().min(1).max(1000),
    back: z.string().trim().min(1).max(3000),
  })
  .strict();

export function createGeneratedStudyNotesSchema(
  numberOfMcqs: number,
  numberOfFlashcards: number,
) {
  return z
    .object({
      title: z.string().trim().min(1).max(200),

      introduction: z.string().trim().min(1).max(10000),

      learningObjectives: z
        .array(z.string().trim().min(1).max(500))
        .min(3)
        .max(8),

      sections: z.array(sectionSchema).min(1).max(15),

      summary: z.string().trim().min(1).max(10000),

      mcqs: z.array(mcqSchema).length(numberOfMcqs),

      flashcards: z.array(flashcardSchema).length(numberOfFlashcards),
    })
    .strict()
    .superRefine((notes, context) => {
      const sectionHeadings = notes.sections.map((section) =>
        section.heading.toLowerCase(),
      );

      if (new Set(sectionHeadings).size !== sectionHeadings.length) {
        context.addIssue({
          code: 'custom',
          path: ['sections'],
          message: 'Section headings must be unique',
        });
      }

      notes.mcqs.forEach((mcq, index) => {
        const normalizedOptions = mcq.options.map((option) =>
          option.toLowerCase(),
        );

        if (new Set(normalizedOptions).size !== normalizedOptions.length) {
          context.addIssue({
            code: 'custom',
            path: ['mcqs', index, 'options'],
            message: 'MCQ options must be unique',
          });
        }

        if (!mcq.options.includes(mcq.correctAnswer)) {
          context.addIssue({
            code: 'custom',
            path: ['mcqs', index, 'correctAnswer'],
            message: 'The correct answer must exactly match one option',
          });
        }
      });
    });
}

export type GeneratedStudyNotes = z.infer<
  ReturnType<typeof createGeneratedStudyNotesSchema>
>;

export function buildStudyNotesJsonSchema(
  numberOfMcqs: number,
  numberOfFlashcards: number,
): Record<string, unknown> {
  return {
    type: 'object',
    additionalProperties: false,

    properties: {
      title: {
        type: 'string',
        description: 'A concise and accurate title for the notes.',
      },

      introduction: {
        type: 'string',
        description: 'A student-friendly introduction to the topic.',
      },

      learningObjectives: {
        type: 'array',
        minItems: 3,
        maxItems: 8,
        description: 'Specific outcomes the student should achieve.',
        items: {
          type: 'string',
        },
      },

      sections: {
        type: 'array',
        minItems: 1,
        maxItems: 15,

        items: {
          type: 'object',
          additionalProperties: false,

          properties: {
            heading: {
              type: 'string',
            },

            content: {
              type: 'string',
            },
          },

          required: ['heading', 'content'],
        },
      },

      summary: {
        type: 'string',
        description: 'A clear recap of the most important concepts.',
      },

      mcqs: {
        type: 'array',
        minItems: numberOfMcqs,
        maxItems: numberOfMcqs,

        items: {
          type: 'object',
          additionalProperties: false,

          properties: {
            question: {
              type: 'string',
            },

            options: {
              type: 'array',
              minItems: 4,
              maxItems: 4,

              items: {
                type: 'string',
              },
            },

            correctAnswer: {
              type: 'string',
              description: 'Must exactly match one item in options.',
            },

            explanation: {
              type: 'string',
            },
          },

          required: ['question', 'options', 'correctAnswer', 'explanation'],
        },
      },

      flashcards: {
        type: 'array',
        minItems: numberOfFlashcards,
        maxItems: numberOfFlashcards,

        items: {
          type: 'object',
          additionalProperties: false,

          properties: {
            front: {
              type: 'string',
            },

            back: {
              type: 'string',
            },
          },

          required: ['front', 'back'],
        },
      },
    },

    required: [
      'title',
      'introduction',
      'learningObjectives',
      'sections',
      'summary',
      'mcqs',
      'flashcards',
    ],
  };
}
