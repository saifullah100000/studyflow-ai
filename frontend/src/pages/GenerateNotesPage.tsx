export default function GenerateNotesPage() {
  return (
    <section>
      <div className="mb-7">
        <h2 className="text-2xl font-bold text-slate-900">Generate Notes</h2>
        <p className="mt-2 text-slate-600">
          Configure your learning material and generate personalized notes.
        </p>
      </div>

      <div className="max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form className="space-y-5">
          <div>
            <label
              htmlFor="topic"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Study topic
            </label>

            <input
              id="topic"
              name="topic"
              type="text"
              placeholder="For example: Operating System Deadlocks"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="difficulty"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Difficulty level
              </label>

              <select
                id="difficulty"
                name="difficulty"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="language"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Language
              </label>

              <select
                id="language"
                name="language"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
              >
                <option value="english">English</option>
                <option value="urdu">Urdu</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition hover:bg-indigo-700"
          >
            Generate Study Notes
          </button>
        </form>
      </div>
    </section>
  );
}