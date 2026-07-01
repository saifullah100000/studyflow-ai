import axios from "axios";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { Link } from "react-router";
import { useAuth } from "../auth/auth-context";
import DeleteNoteDialog from "../components/DeleteNoteDialog";
import { api } from "../services/api";
import type {
  NoteListItem,
  NotesListResponse,
  NotesPagination,
} from "../types/note";

const PAGE_SIZE = 6;

const emptyPagination: NotesPagination = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

interface AppliedFilters {
  title: string;
  subject: string;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(value));
}

function NotesLoadingSkeleton() {
  return (
    <div
      className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
      aria-label="Loading notes"
    >
      {Array.from({ length: PAGE_SIZE }).map((_, index) => (
        <article
          key={index}
          className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="h-5 w-3/4 rounded bg-slate-200" />
          <div className="mt-3 h-4 w-1/3 rounded bg-slate-200" />

          <div className="mt-6 space-y-2">
            <div className="h-4 w-full rounded bg-slate-200" />
            <div className="h-4 w-5/6 rounded bg-slate-200" />
            <div className="h-4 w-2/3 rounded bg-slate-200" />
          </div>

          <div className="mt-6 h-9 w-full rounded bg-slate-200" />
        </article>
      ))}
    </div>
  );
}

function getPageNumbers(
  currentPage: number,
  totalPages: number,
): number[] {
  if (totalPages <= 5) {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1,
    );
  }

  let startPage = Math.max(1, currentPage - 2);
  let endPage = startPage + 4;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = totalPages - 4;
  }

  return Array.from(
    { length: endPage - startPage + 1 },
    (_, index) => startPage + index,
  );
}

export default function NotesPage() {
  const { refreshUser } = useAuth();

  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [pagination, setPagination] =
    useState<NotesPagination>(emptyPagination);

  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [titleInput, setTitleInput] = useState("");
  const [subjectInput, setSubjectInput] = useState("");

  const [filters, setFilters] = useState<AppliedFilters>({
    title: "",
    subject: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [noteToDelete, setNoteToDelete] =
    useState<NoteListItem | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    api
      .get<NotesListResponse>("/notes", {
        params: {
          page,
          limit: PAGE_SIZE,
          title: filters.title || undefined,
          subject: filters.subject || undefined,
        },
        signal: controller.signal,
      })
      .then((response) => {
        if (!isActive) {
          return;
        }

        setNotes(response.data.data);
        setPagination(response.data.pagination);
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

        setErrorMessage(
          "Your notes could not be loaded. Please try again.",
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
  }, [filters, page, refreshUser, reloadKey]);

  const pageNumbers = useMemo(
    () => getPageNumbers(page, pagination.totalPages),
    [page, pagination.totalPages],
  );

  const hasFilters =
    filters.title.length > 0 || filters.subject.length > 0;

  function handleSearch(
    event: FormEvent<HTMLFormElement>,
  ): void {
    event.preventDefault();

    setPage(1);
    setIsLoading(true);
    setFilters({
      title: titleInput.trim(),
      subject: subjectInput.trim(),
    });
  }

  function clearFilters(): void {
    setTitleInput("");
    setSubjectInput("");
    setPage(1);
    setIsLoading(true);
    setFilters({
      title: "",
      subject: "",
    });
  }

  function changePage(nextPage: number): void {
    if (
      nextPage < 1 ||
      nextPage > pagination.totalPages ||
      nextPage === page
    ) {
      return;
    }

    setIsLoading(true);
    setPage(nextPage);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleDelete(): Promise<void> {
    if (!noteToDelete) {
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      await api.delete(`/notes/${noteToDelete.id}`);

      setNoteToDelete(null);

      if (notes.length === 1 && page > 1) {
        setIsLoading(true);
        setPage((currentPage) => currentPage - 1);
      } else {
        setIsLoading(true);
        setReloadKey((current) => current + 1);
      }
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

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            Notes library
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            My notes
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Search, review and manage your saved study material.
          </p>
        </div>

        <Link
          to="/generate"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Generate new notes
        </Link>
      </div>

      <form
        onSubmit={handleSearch}
        className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="note-title-search"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Search by title
            </label>

            <input
              id="note-title-search"
              type="search"
              value={titleInput}
              onChange={(event) =>
                setTitleInput(event.target.value)
              }
              placeholder="Example: Database Normalization"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label
              htmlFor="note-subject-filter"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Filter by subject
            </label>

            <input
              id="note-subject-filter"
              type="search"
              value={subjectInput}
              onChange={(event) =>
                setSubjectInput(event.target.value)
              }
              placeholder="Example: Databases"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Apply filters
          </button>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Clear filters
            </button>
          )}
        </div>
      </form>

      {deleteError && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {deleteError}
        </div>
      )}

      <div className="mt-7 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {isLoading
            ? "Loading notes..."
            : `${pagination.total} ${
                pagination.total === 1 ? "note" : "notes"
              } found`}
        </p>

        {pagination.totalPages > 0 && (
          <p className="text-sm text-slate-500">
            Page {pagination.page} of {pagination.totalPages}
          </p>
        )}
      </div>

      <div className="mt-4">
        {isLoading && <NotesLoadingSkeleton />}

        {!isLoading && errorMessage && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 font-bold text-red-700">
              !
            </div>

            <h2 className="mt-4 text-lg font-semibold text-red-900">
              Unable to load notes
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                setReloadKey((current) => current + 1);
              }}
              className="mt-5 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-800"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading &&
          !errorMessage &&
          notes.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-2xl font-bold text-indigo-700">
                N
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-900">
                {hasFilters
                  ? "No matching notes found"
                  : "Your notes library is empty"}
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {hasFilters
                  ? "Try changing the title or subject filters to find other notes."
                  : "Generate or create your first note to begin building your study library."}
              </p>

              {hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Clear filters
                </button>
              ) : (
                <Link
                  to="/generate"
                  className="mt-6 inline-flex rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                >
                  Generate your first note
                </Link>
              )}
            </div>
          )}

        {!isLoading &&
          !errorMessage &&
          notes.length > 0 && (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {notes.map((note) => (
                <article
                  key={note.id}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="line-clamp-2 text-lg font-bold text-slate-900">
                        {note.title}
                      </h2>

                      <p className="mt-2 text-sm font-medium text-indigo-600">
                        {note.topic || "No subject"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError("");
                        setNoteToDelete(note);
                      }}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>

                  <p className="mt-4 line-clamp-3 min-h-16 text-sm leading-6 text-slate-500">
                    {note.summary ||
                      "No summary has been added to this note."}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <span className="rounded-lg bg-slate-100 px-3 py-2">
                      {note._count.sections} sections
                    </span>

                    <span className="rounded-lg bg-slate-100 px-3 py-2">
                      {note._count.flashcards} flashcards
                    </span>

                    <span className="rounded-lg bg-slate-100 px-3 py-2">
                      {note._count.quizzes} quizzes
                    </span>

                    <span className="rounded-lg bg-slate-100 px-3 py-2">
                      {note._count.files} files
                    </span>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <p className="text-xs text-slate-400">
                      Updated {formatDate(note.updatedAt)}
                    </p>

                    <Link
                      to={`/notes/${note.id}`}
                      className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
                    >
                      View note
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
      </div>

      {!isLoading &&
        !errorMessage &&
        pagination.totalPages > 1 && (
          <nav
            aria-label="Notes pagination"
            className="mt-8 flex flex-wrap items-center justify-center gap-2"
          >
            <button
              type="button"
              onClick={() => changePage(page - 1)}
              disabled={!pagination.hasPreviousPage}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => changePage(pageNumber)}
                aria-current={
                  pageNumber === page ? "page" : undefined
                }
                className={
                  pageNumber === page
                    ? "h-10 min-w-10 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white"
                    : "h-10 min-w-10 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                }
              >
                {pageNumber}
              </button>
            ))}

            <button
              type="button"
              onClick={() => changePage(page + 1)}
              disabled={!pagination.hasNextPage}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </nav>
        )}

      <DeleteNoteDialog
        isOpen={noteToDelete !== null}
        noteTitle={noteToDelete?.title ?? ""}
        isDeleting={isDeleting}
        onCancel={() => {
          if (!isDeleting) {
            setNoteToDelete(null);
          }
        }}
        onConfirm={handleDelete}
      />
    </section>
  );
}