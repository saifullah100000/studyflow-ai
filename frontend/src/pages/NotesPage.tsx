export default function NotesPage() {
  return (
    <section>
      <div className="mb-7">
        <h2 className="text-2xl font-bold text-slate-900">My Notes</h2>
        <p className="mt-2 text-slate-600">
          Your generated study materials will appear here.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <p className="text-lg font-medium text-slate-700">
          No notes generated yet
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Generate your first set of AI-powered study notes.
        </p>
      </div>
    </section>
  );
}