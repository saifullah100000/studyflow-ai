# StudyFlow AI PDF template

`study-notes.template.html` is an A4, print-ready Handlebars template for generated study notes. It is deliberately self-contained: styles are inline so the PDF renderer does not need to load external fonts, images, or stylesheets.

## Template data

Supply escaped text values for `title`, `subject`, `topic`, `studentLevel`, `language`, `languageCode`, `textDirection`, `studentName`, `generatedAt`, `introduction`, and `summary`.

The template also expects these arrays:

- `objectives`: strings
- `sections`: `{ heading, content }`
- `examples`: optional `{ title?, heading, content }`
- `mcqs`: optional `{ question, options, correctAnswer, explanation? }`
- `flashcards`: optional `{ front, back }`

Register the small Handlebars helpers used by the template before rendering:

```ts
handlebars.registerHelper('add', (value: number, amount: number) => value + amount);
handlebars.registerHelper('letter', (index: number) => String.fromCharCode(65 + index));
```

For best results, use a Chromium/Puppeteer-style renderer with `printBackground: true`, `format: 'A4'`, and CSS page size preference enabled. The template includes fixed header/footer treatment and CSS page counters; if the chosen renderer does not support CSS counters in fixed elements, use its header/footer API to inject the final page number.
