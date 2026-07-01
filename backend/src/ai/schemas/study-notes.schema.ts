import { z } from 'zod';

const generatedSectionSchema = z
  .object({
    heading: z.string().min(1).max(200),
    content: z.string().min(1),
  })
  .strict();

const generatedFlashcardSchema = z
  .object({
    front: z.string().min(1),
    back: z.string().min(1),
  })
  .strict();

const generatedQuestionSchema = z
  .object({
    question: z.string().min(1),
    options: z.array(z.string().min(1)).length(4),
    correctAnswer: z.string().min(1),
    explanation: z.string().min(1),
  })
  .strict();

export const generatedStudyNotesSchema = z
  .object({
    title: z.string().min(1).max(200),
    summary: z.string().min(1),
    content: z.string().min(1),

    sections: z.array(generatedSectionSchema).min(1),

    flashcards: z.array(generatedFlashcardSchema),

    quiz: z
      .object({
        title: z.string().min(1).max(200),
        description: z.string(),
        questions: z.array(generatedQuestionSchema),
      })
      .strict(),
  })
  .strict();

export type GeneratedStudyNotes = z.infer<typeof generatedStudyNotesSchema>;

export function buildStudyNotesJsonSchema(
  numberOfMcqs: number,
  numberOfFlashcards: number,
) {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: {
        type: 'string',
        description: 'A clear, concise title for the generated study notes.',
      },

      summary: {
        type: 'string',
        description: 'A useful overview summarizing the most important ideas.',
      },

      content: {
        type: 'string',
        description:
          'A readable introduction and overall explanation of the topic.',
      },

      sections: {
        type: 'array',
        minItems: 1,
        maxItems: 15,
        description:
          'Ordered study-note sections covering the topic thoroughly.',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            heading: {
              type: 'string',
              description: 'The section heading.',
            },
            content: {
              type: 'string',
              description: 'The complete educational content for this section.',
            },
          },
          required: ['heading', 'content'],
        },
      },

      flashcards: {
        type: 'array',
        minItems: numberOfFlashcards,
        maxItems: numberOfFlashcards,
        description:
          'Revision flashcards. Return exactly the requested number.',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            front: {
              type: 'string',
              description: 'A question, term or revision prompt.',
            },
            back: {
              type: 'string',
              description: 'The correct answer or explanation.',
            },
          },
          required: ['front', 'back'],
        },
      },

      quiz: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: {
            type: 'string',
            description: 'A suitable quiz title.',
          },
          description: {
            type: 'string',
            description: 'A short explanation of what the quiz covers.',
          },
          questions: {
            type: 'array',
            minItems: numberOfMcqs,
            maxItems: numberOfMcqs,
            description:
              'Multiple-choice questions. Return exactly the requested number.',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                question: {
                  type: 'string',
                  description: 'A clear multiple-choice question.',
                },
                options: {
                  type: 'array',
                  minItems: 4,
                  maxItems: 4,
                  items: {
                    type: 'string',
                  },
                  description: 'Exactly four possible answers.',
                },
                correctAnswer: {
                  type: 'string',
                  description:
                    'The exact text of one option from the options array.',
                },
                explanation: {
                  type: 'string',
                  description: 'Why the correct answer is correct.',
                },
              },
              required: ['question', 'options', 'correctAnswer', 'explanation'],
            },
          },
        },
        required: ['title', 'description', 'questions'],
      },
    },
    required: ['title', 'summary', 'content', 'sections', 'flashcards', 'quiz'],
  };
}
