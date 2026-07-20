import axios from "axios";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useAuth } from "../auth/auth-context";
import DeleteNoteDialog from "../components/DeleteNoteDialog";
import { api } from "../services/api";
import type { NoteDetails, QuizQuestion } from "../types/note";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function PreviewSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-56 rounded-3xl bg-slate-200" />
      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-40 rounded-2xl bg-slate-200" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}

function sectionAnchor(label: string) {
  return label.toLowerCase().replaceAll(" ", "-");
}

export default function NoteDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [note, setNote] = useState<NoteDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [summary, setSummary] = useState("");
  const [revealedAnswers, setRevealedAnswers] = useState<Set<string>>(new Set());
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [actionMessage, setActionMessage] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    let isActive = true;

    api.get<NoteDetails>(`/notes/${id}`, { signal: controller.signal })
      .then((response) => {
        if (!isActive) return;
        setNote(response.data);
        setTitle(response.data.title);
        setTopic(response.data.topic ?? "");
        setSummary(response.data.summary ?? "");
        setErrorMessage("");
      })
      .catch((error: unknown) => {
        if (!isActive || (axios.isAxiosError(error) && error.code === "ERR_CANCELED")) return;
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          void refreshUser();
          return;
        }
        setErrorMessage(error && axios.isAxiosError(error) && error.response?.status === 404
          ? "This note does not exist or you do not have permission to view it."
          : "The note could not be loaded. Please try again.");
      })
      .finally(() => { if (isActive) setIsLoading(false); });

    return () => { isActive = false; controller.abort(); };
  }, [id, refreshUser]);

  function startEditing() {
    if (!note) return;
    setTitle(note.title);
    setTopic(note.topic ?? "");
    setSummary(note.summary ?? "");
    setEditError("");
    setIsEditing(true);
  }

  async function saveEdits(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!note || !title.trim()) {
      setEditError("A title is required.");
      return;
    }
    setIsSaving(true);
    setEditError("");
    try {
      const response = await api.patch<NoteDetails>(`/notes/${note.id}`, {
        title: title.trim(), topic: topic.trim() || null, summary: summary.trim() || null,
      });
      setNote(response.data);
      setIsEditing(false);
      setActionMessage("Your note details have been saved.");
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await refreshUser();
        return;
      }
      setEditError("Changes could not be saved. Please try again.");
    } finally { setIsSaving(false); }
  }

  async function handleDelete() {
    if (!note) return;
    setIsDeleting(true); setDeleteError("");
    try { await api.delete(`/notes/${note.id}`); navigate("/notes", { replace: true }); }
    catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 401) { await refreshUser(); return; }
      setDeleteError("The note could not be deleted. Please try again.");
    } finally { setIsDeleting(false); }
  }

  function toggleAnswer(question: QuizQuestion) {
    setRevealedAnswers((current) => {
      const next = new Set(current);
      if (next.has(question.id)) {
        next.delete(question.id);
      } else {
        next.add(question.id);
      }
      return next;
    });
  }
    async function handleDownloadPdf() {
  if (!note) return;

  try {
    setActionMessage("Generating PDF...");

    const response = await api.post(
      `/pdf/generate/${note.id}`,
      {}
    );

    const pdfUrl = response.data.url;

    if (!pdfUrl) {
      throw new Error("PDF URL missing");
    }

    const link = document.createElement("a");

    link.href = pdfUrl;
    link.download = `${note.title}.pdf`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    setActionMessage("PDF downloaded successfully.");

  } catch(error) {

    console.error(error);

    setActionMessage(
      "PDF generation failed."
    );
  }
}
  function toggleFlashcard(cardId: string) {
    setFlippedCards((current) => {
      const next = new Set(current);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  }

  if (!id || (!isLoading && (errorMessage || !note))) {
    return <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center">
      <h1 className="text-xl font-bold text-red-900">Unable to open note</h1>
      <p className="mt-2 text-sm text-red-700">{errorMessage || "A note ID was not provided."}</p>
      <Link to="/notes" className="mt-6 inline-flex rounded-xl bg-red-700 px-5 py-2.5 text-sm font-semibold text-white">Return to notes</Link>
    </div>;
  }
  if (isLoading || !note) return <PreviewSkeleton />;

  const questions = note.quizzes.flatMap((quiz) => quiz.questions);
  const sections = ["Objectives", "Explanations", "Examples", "Summary", "MCQs", "Flashcards"];

  return <section className="mx-auto max-w-6xl pb-8">
    <div className="mb-6 flex items-center justify-between gap-3">
      <Link to="/notes" className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-800">← Back to notes</Link>
      <span className="text-xs text-slate-500">Updated {formatDate(note.updatedAt)}</span>
    </div>

    {actionMessage && <div role="status" className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{actionMessage}</div>}
    {deleteError && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{deleteError}</div>}

    <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-6 text-white shadow-xl shadow-indigo-200 sm:p-9">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-3xl">
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">{note.topic || "Study notes"}</span>
            <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">Generated with AI</span>
          </div>
          <p className="mt-6 text-sm font-medium text-indigo-100">Your study guide</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{note.title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-indigo-100">{note.summary || "A structured study guide, ready to review, practise and remember."}</p>
        </div>
        <div className="grid min-w-36 grid-cols-2 gap-2 text-center text-xs">
          <div className="rounded-xl bg-white/10 px-3 py-3"><strong className="block text-lg text-white">{note.sections.length}</strong>sections</div>
          <div className="rounded-xl bg-white/10 px-3 py-3"><strong className="block text-lg text-white">{questions.length}</strong>MCQs</div>
          <div className="rounded-xl bg-white/10 px-3 py-3"><strong className="block text-lg text-white">{note.flashcards.length}</strong>cards</div>
          <div className="rounded-xl bg-white/10 px-3 py-3"><strong className="block text-lg text-white">{note.learningObjectives.length}</strong>goals</div>
        </div>
      </div>
      <div className="mt-7 flex flex-wrap gap-3">
        <button type="button" onClick={startEditing} className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50">Edit note</button>
        <button type="button" onClick={() => navigate("/generate", { state: { topic: note.title, subject: note.topic } })} className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20">Regenerate</button>
        <button
  type="button"
  onClick={handleDownloadPdf}
  className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20"
>
  Download PDF
</button>
      </div>
    </header>

    {isEditing && <form onSubmit={saveEdits} className="mt-6 rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4"><h2 className="text-lg font-bold text-slate-900">Edit note details</h2><button type="button" onClick={() => setIsEditing(false)} className="text-sm font-semibold text-slate-500">Cancel</button></div>
      {editError && <p role="alert" className="mt-3 text-sm text-red-700">{editError}</p>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">Title<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label>
        <label className="text-sm font-medium text-slate-700">Subject<input value={topic} onChange={(event) => setTopic(event.target.value)} maxLength={120} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label>
      </div>
      <label className="mt-4 block text-sm font-medium text-slate-700">Summary<textarea value={summary} onChange={(event) => setSummary(event.target.value)} maxLength={5000} rows={3} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label>
      <button disabled={isSaving} className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{isSaving ? "Saving..." : "Save changes"}</button>
    </form>}

    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
      <main className="min-w-0 space-y-6">
        <article id={sectionAnchor("Objectives")} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Start here</p><h2 className="mt-1 text-2xl font-bold text-slate-900">Objectives</h2>
          {note.learningObjectives.length ? <ol className="mt-5 grid gap-3 sm:grid-cols-2">{note.learningObjectives.map((objective, index) => <li key={`${index}-${objective}`} className="flex gap-3 rounded-xl bg-indigo-50 p-4 text-sm leading-6 text-indigo-950"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">{index + 1}</span>{objective}</li>)}</ol> : <p className="mt-4 text-sm text-slate-500">Learning objectives will appear here when provided.</p>}
        </article>
        <article id={sectionAnchor("Explanations")} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-widest text-sky-600">Understand</p><h2 className="mt-1 text-2xl font-bold text-slate-900">Explanations</h2>
          {note.introduction && <p className="mt-5 whitespace-pre-wrap rounded-xl border-l-4 border-sky-400 bg-sky-50 p-4 text-sm leading-7 text-slate-700">{note.introduction}</p>}
          {note.content && <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-700">{note.content}</div>}
          {note.sections.filter((section) => !/example/i.test(section.heading)).map((section, index) => <div key={section.id} className="mt-5 border-t border-slate-100 pt-5"><p className="text-xs font-bold text-slate-400">{String(index + 1).padStart(2, "0")}</p><h3 className="mt-1 text-lg font-bold text-slate-900">{section.heading}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">{section.content}</p></div>)}
        </article>
        <article id={sectionAnchor("Examples")} className="rounded-2xl border border-amber-100 bg-amber-50 p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-widest text-amber-700">Apply it</p><h2 className="mt-1 text-2xl font-bold text-amber-950">Examples</h2>
          {note.sections.filter((section) => /example/i.test(section.heading)).length ? note.sections.filter((section) => /example/i.test(section.heading)).map((section) => <div key={section.id} className="mt-5 rounded-xl bg-white/80 p-4"><h3 className="font-bold text-amber-950">{section.heading}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-amber-950/80">{section.content}</p></div>) : <p className="mt-4 text-sm leading-6 text-amber-900/70">Practical examples were not included in this generation.</p>}
        </article>
        <article id={sectionAnchor("Summary")} className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm"><p className="text-xs font-bold uppercase tracking-widest text-violet-300">Key takeaways</p><h2 className="mt-1 text-2xl font-bold">Summary</h2><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-200">{note.summary || "Review the objectives and explanations above to consolidate this topic."}</p></article>
        <section id={sectionAnchor("MCQs")} className="scroll-mt-24"><div><p className="text-xs font-bold uppercase tracking-widest text-rose-600">Test yourself</p><h2 className="mt-1 text-2xl font-bold text-slate-900">MCQs</h2></div>{questions.length ? <div className="mt-4 space-y-4">{questions.map((question, index) => <article key={question.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="font-bold text-slate-900"><span className="mr-2 text-indigo-600">{index + 1}.</span>{question.question}</p><div className="mt-4 grid gap-2">{question.options.map((option, optionIndex) => <div key={`${question.id}-${optionIndex}`} className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"><span className="mr-2 font-bold text-slate-400">{String.fromCharCode(65 + optionIndex)}.</span>{option}</div>)}</div><button type="button" onClick={() => toggleAnswer(question)} className="mt-4 text-sm font-bold text-indigo-600">{revealedAnswers.has(question.id) ? "Hide answer" : "Reveal answer"}</button>{revealedAnswers.has(question.id) && <div className="mt-3 rounded-xl bg-green-50 p-4 text-sm text-green-900"><strong>Answer: </strong>{question.correctAnswer}{question.explanation && <p className="mt-2 leading-6 text-green-800">{question.explanation}</p>}</div>}</article>)}</div> : <p className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No MCQs were generated for this note.</p>}</section>
        <section id={sectionAnchor("Flashcards")} className="scroll-mt-24"><div><p className="text-xs font-bold uppercase tracking-widest text-fuchsia-600">Recall faster</p><h2 className="mt-1 text-2xl font-bold text-slate-900">Flashcards</h2></div>{note.flashcards.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2">{note.flashcards.map((card, index) => <button key={card.id} type="button" onClick={() => toggleFlashcard(card.id)} className="min-h-44 rounded-2xl border border-violet-200 bg-gradient-to-br from-white to-violet-50 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><span className="text-xs font-bold uppercase tracking-widest text-violet-600">Card {index + 1} · {flippedCards.has(card.id) ? "Answer" : "Question"}</span><p className="mt-5 text-base font-bold leading-7 text-slate-900">{flippedCards.has(card.id) ? card.back : card.front}</p><span className="mt-5 block text-xs font-semibold text-slate-500">Click to flip</span></button>)}</div> : <p className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No flashcards were generated for this note.</p>}</section>
      </main>
      <aside className="hidden lg:block"><div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-widest text-slate-400">In this guide</p><nav className="mt-4 space-y-1">{sections.map((item) => <a key={item} href={`#${sectionAnchor(item)}`} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700">{item}</a>)}</nav><div className="mt-5 border-t border-slate-100 pt-4"><button type="button" onClick={() => { setDeleteError(""); setShowDeleteDialog(true); }} className="text-sm font-semibold text-red-600 hover:text-red-700">Delete note</button></div></div></aside>
    </div>
    <DeleteNoteDialog isOpen={showDeleteDialog} noteTitle={note.title} isDeleting={isDeleting} onCancel={() => { if (!isDeleting) setShowDeleteDialog(false); }} onConfirm={handleDelete} />
  </section>;
}
