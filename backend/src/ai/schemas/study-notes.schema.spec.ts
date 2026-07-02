/// <reference types="jest" />

import { createGeneratedStudyNotesSchema } from './study-notes.schema';

describe('Generated study notes schema', () => {
  const validOutput = {
    title: 'Database Normalization',

    introduction: 'Database normalization organizes relational data.',

    learningObjectives: [
      'Explain the purpose of normalization',
      'Identify the first three normal forms',
      'Recognize database dependencies',
    ],

    sections: [
      {
        heading: 'First Normal Form',
        content: 'First Normal Form requires atomic values.',
      },
    ],

    summary: 'Normalization reduces duplication and inconsistency.',

    mcqs: [
      {
        question: 'What does 1NF require?',
        options: [
          'Atomic values',
          'Duplicate rows',
          'No primary key',
          'Multiple values per column',
        ],
        correctAnswer: 'Atomic values',
        explanation:
          'First Normal Form requires each field to contain one atomic value.',
      },
    ],

    flashcards: [
      {
        front: 'What is normalization?',
        back: 'A process for organizing relational data.',
      },
    ],
  };

  it('accepts valid structured output', () => {
    const schema = createGeneratedStudyNotesSchema(1, 1);

    expect(schema.safeParse(validOutput).success).toBe(true);
  });

  it('rejects missing required properties', () => {
    const schema = createGeneratedStudyNotesSchema(1, 1);

    const invalidOutput = {
      ...validOutput,
      introduction: undefined,
    };

    expect(schema.safeParse(invalidOutput).success).toBe(false);
  });

  it('rejects incorrect MCQ counts', () => {
    const schema = createGeneratedStudyNotesSchema(2, 1);

    expect(schema.safeParse(validOutput).success).toBe(false);
  });

  it('rejects incorrect flashcard counts', () => {
    const schema = createGeneratedStudyNotesSchema(1, 2);

    expect(schema.safeParse(validOutput).success).toBe(false);
  });

  it('rejects an answer not present in options', () => {
    const schema = createGeneratedStudyNotesSchema(1, 1);

    const invalidOutput = {
      ...validOutput,

      mcqs: [
        {
          ...validOutput.mcqs[0],
          correctAnswer: 'An option that does not exist',
        },
      ],
    };

    expect(schema.safeParse(invalidOutput).success).toBe(false);
  });
});
