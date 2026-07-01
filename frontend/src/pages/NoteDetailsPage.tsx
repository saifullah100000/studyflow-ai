import axios from "axios";
import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router";
import { useAuth } from "../auth/auth-context";
import DeleteNoteDialog from "../components/DeleteNoteDialog";
import { api } from "../services/api";
import type { NoteDetails } from "../types/note";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function NoteDetailsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-7">
        <div className="h-4 w-28 rounded bg-slate-200" />
        <div className="mt-4 h-9 w-3/4 rounded bg-slate-200" />
        <div className="mt-3 h-4 w-40 rounded bg-slate-200" />
      </div>

      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-slate-200 bg-white p-7"
        >
          <div className="h-6 w-1/3 rounded bg-slate-200" />

          <div className="mt-5 space-y-3">
            <div className="h-4 w-full rounded bg-slate-200" />
            <div className="h-4 w-full rounded bg-slate-200" />
            <div className="h-4 w-4/5 rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function NoteDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [note, setNote] = useState<NoteDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [showDeleteDialog, setShowDeleteDialog] =
    useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (!id) {
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    api
      .get<NoteDetails>(`/notes/${id}`, {
        signal: controller.signal,
      })
      .then((response) => {
        if (!isActive) {
          return;
        }

        setNote(response.data);
        setErrorMessage("");
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        if (
          axios.isAxiosError(error) &&
          error.code === "ERR_CANCELED"
        ) {
          return;
        }

        if (
          axios.isAxiosError(error) &&
          error.response?.status === 401
        ) {
          void refreshUser();
          return;
        }

        if (
          axios.isAxiosError(error) &&
          error.response?.status === 404
        ) {
          setErrorMessage(
            "This note does not exist or you do not have permission to view it.",
          );
          return;
        }

        setErrorMessage(
          "The note could not be loaded. Please try again.",
        );
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [id, refreshUser]);

  async function handleDelete(): Promise<void> {
    if (!note) {
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      await api.delete(`/notes/${note.id}`);
      navigate("/notes", { replace: true });
    } catch (error: unknown) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 401
      ) {
        await refreshUser();
        return;
      }

      setDeleteError(
        "The note could not be deleted. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <NoteDetailsSkeleton />;
  }

  if (errorMessage || !note) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-xl font-bold text-red-700">
          !
        </div>

        <h1 className="mt-5 text-xl font-bold text-red-900">
          Unable to open note
        </h1>

        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-red-700">
          {errorMessage || "Note not found."}
        </p>

        <Link
          to="/notes"
          className="mt-6 inline-flex rounded-lg bg-red-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-800"
        >
          Return to notes
        </Link>
      </div>
    );
  }

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/notes"
          className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
        >
          ← Back to notes
        </Link>

        <button
          type="button"
          onClick={() => {
            setDeleteError("");
            setShowDeleteDialog(true);
          }}
          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          Delete note
        </button>
      </div>

      {deleteError && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {deleteError}
        </div>
      )}

      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            {note.topic || "No subject"}
          </span>

          {note.generationJobId && (
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              AI generated
            </span>
          )}
        </div>

        <h1 className="mt-5 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
          {note.title}
        </h1>

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
          <span>Created {formatDate(note.createdAt)}</span>
          <span>Updated {formatDate(note.updatedAt)}</span>
        </div>
      </header>

      {note.summary && (
        <article className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
          <h2 className="text-lg font-bold text-indigo-950">
            Summary
          </h2>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-indigo-900">
            {note.summary}
          </p>
        </article>
      )}

      {note.content && (
        <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-slate-900">
            Note content
          </h2>

          <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {note.content}
          </div>
        </article>
      )}

      {note.sections.length > 0 && (
        <section className="mt-8">
          <div className="mb-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
              Sections
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              Structured notes
            </h2>
          </div>

          <div className="space-y-5">
            {note.sections.map((section, index) => (
              <article
                key={section.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-700">
                    {index + 1}
                  </span>

                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {section.heading}
                    </h3>

                    <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                      {section.content}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {note.flashcards.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Flashcards
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {note.flashcards.map((flashcard) => (
              <article
                key={flashcard.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  Front
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {flashcard.front}
                </p>

                <div className="my-5 border-t border-slate-200" />

                <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                  Back
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {flashcard.back}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {note.quizzes.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Quizzes
          </h2>

          <div className="mt-4 space-y-5">
            {note.quizzes.map((quiz) => (
              <article
                key={quiz.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
              >
                <h3 className="text-xl font-bold text-slate-900">
                  {quiz.title}
                </h3>

                {quiz.description && (
                  <p className="mt-2 text-sm text-slate-500">
                    {quiz.description}
                  </p>
                )}

                <div className="mt-6 space-y-6">
                  {quiz.questions.map((question, index) => (
                    <section
                      key={question.id}
                      className="rounded-xl bg-slate-50 p-5"
                    >
                      <p className="font-semibold text-slate-900">
                        {index + 1}. {question.question}
                      </p>

                      {question.options.length > 0 && (
                        <ul className="mt-3 space-y-2">
                          {question.options.map(
                            (option, optionIndex) => (
                              <li
                                key={`${question.id}-${optionIndex}`}
                                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
                              >
                                {String.fromCharCode(
                                  65 + optionIndex,
                                )}
                                . {option}
                              </li>
                            ),
                          )}
                        </ul>
                      )}

                      <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                          Correct answer
                        </p>

                        <p className="mt-1 text-sm font-medium text-green-900">
                          {question.correctAnswer}
                        </p>

                        {question.explanation && (
                          <p className="mt-2 text-sm leading-6 text-green-800">
                            {question.explanation}
                          </p>
                        )}
                      </div>
                    </section>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {note.files.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Files
          </h2>

          <div className="mt-4 space-y-3">
            {note.files.map((file) => (
              <article
                key={file.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {file.originalName}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {file.kind.replaceAll("_", " ")} ·{" "}
                    {formatFileSize(file.sizeBytes)}
                  </p>
                </div>

                {file.publicUrl && (
                  <a
                    href={file.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Open file
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {!note.content &&
        !note.summary &&
        note.sections.length === 0 &&
        note.flashcards.length === 0 &&
        note.quizzes.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <h2 className="text-lg font-bold text-slate-900">
              This note has no content yet
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Note content, sections, flashcards and quizzes will
              appear here.
            </p>
          </div>
        )}

      <DeleteNoteDialog
        isOpen={showDeleteDialog}
        noteTitle={note.title}
        isDeleting={isDeleting}
        onCancel={() => {
          if (!isDeleting) {
            setShowDeleteDialog(false);
          }
        }}
        onConfirm={handleDelete}
      />
    </section>
  );
}