const statistics = [
  {
    title: "Total Notes",
    value: "0",
    description: "Notes generated so far",
  },
  {
    title: "PDF Documents",
    value: "0",
    description: "PDF files created",
  },
  {
    title: "WhatsApp Deliveries",
    value: "0",
    description: "Documents successfully sent",
  },
  {
    title: "Quiz Attempts",
    value: "0",
    description: "Quizzes completed",
  },
];

export default function DashboardPage() {
  return (
    <section>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">
          Welcome to StudyFlow AI
        </h2>

        <p className="mt-2 text-slate-600">
          Generate notes, quizzes and flashcards using artificial intelligence.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statistics.map((statistic) => (
          <article
            key={statistic.title}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">
              {statistic.title}
            </p>

            <p className="mt-3 text-3xl font-bold text-slate-900">
              {statistic.value}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              {statistic.description}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-indigo-600 p-6 text-white shadow-sm">
        <h3 className="text-xl font-semibold">Start learning smarter</h3>

        <p className="mt-2 max-w-2xl text-sm text-indigo-100">
          Enter any study topic and StudyFlow AI will generate structured notes,
          revision flashcards and practice questions.
        </p>
      </div>
    </section>
  );
}