# StudyFlow AI Architecture

## Frontend

Technology: React, TypeScript and Tailwind CSS

Responsibilities:

- Authentication pages
- Dashboard
- Notes generation form
- Notes preview
- Quiz interface
- Flashcards
- User settings

## Backend

Technology: NestJS and Prisma

Responsibilities:

- Authentication
- Authorization
- Database operations
- n8n communication
- PDF generation
- Secure file access

## Database

Technology: PostgreSQL

Stores:

- Users
- Notes
- Note sections
- Generation jobs
- Quizzes
- Flashcards
- Files
- Delivery logs

## Automation

Technology: n8n

Responsibilities:

- Receive generation requests
- Call Gemini
- Return structured notes
- Trigger PDF generation
- Send PDF through WhatsApp
- Report workflow failures

## Storage

Technology: Cloudflare R2

Responsibilities:

- Store generated PDFs
- Provide temporary or protected download URLs