interface DeleteNoteDialogProps {
  isOpen: boolean;
  noteTitle: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteNoteDialog({
  isOpen,
  noteTitle,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteNoteDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isDeleting) {
          onCancel();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-note-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl font-bold text-red-700">
          !
        </div>

        <h2
          id="delete-note-title"
          className="mt-5 text-xl font-bold text-slate-900"
        >
          Delete this note?
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          You are about to permanently delete{" "}
          <span className="font-semibold text-slate-900">
            {noteTitle}
          </span>
          . Its sections, flashcards and quizzes will also be removed.
        </p>

        <p className="mt-2 text-sm font-medium text-red-700">
          This action cannot be undone.
        </p>

        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isDeleting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
          >
            {isDeleting ? "Deleting..." : "Delete note"}
          </button>
        </div>
      </section>
    </div>
  );
}