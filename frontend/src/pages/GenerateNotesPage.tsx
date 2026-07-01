import axios from "axios";
import {
  useState,
  type FormEvent,
} from "react";
import { api } from "../services/api";
import type {
  CreateGenerationResponse,
  GenerationFormData,
} from "../types/generation";

interface ApiErrorResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

const initialFormData: GenerationFormData = {
  topic: "",
  subject: "",
  educationLevel: "UNIVERSITY",
  language: "ENGLISH",
  notesLength: "MEDIUM",
  numberOfMcqs: 10,
  numberOfFlashcards: 10,
  includePracticalExamples: true,
  sendToWhatsapp: false,
};

export default function GenerateNotesPage() {
  const [formData, setFormData] =
    useState<GenerationFormData>(initialFormData);

  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [createdJobId, setCreatedJobId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof GenerationFormData>(
    field: K,
    value: GenerationFormData[K],
  ): void {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function validateForm(): string[] {
    const validationErrors: string[] = [];

    if (formData.topic.trim().length < 3) {
      validationErrors.push(
        "Topic must contain at least 3 characters",
      );
    }

    if (formData.subject.trim().length < 2) {
      validationErrors.push(
        "Subject must contain at least 2 characters",
      );
    }

    if (
      !Number.isInteger(formData.numberOfMcqs) ||
      formData.numberOfMcqs < 0 ||
      formData.numberOfMcqs > 50
    ) {
      validationErrors.push(
        "Number of MCQs must be between 0 and 50",
      );
    }

    if (
      !Number.isInteger(formData.numberOfFlashcards) ||
      formData.numberOfFlashcards < 0 ||
      formData.numberOfFlashcards > 50
    ) {
      validationErrors.push(
        "Number of flashcards must be between 0 and 50",
      );
    }

    return validationErrors;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setErrors([]);
    setSuccessMessage("");
    setCreatedJobId("");

    const validationErrors = validateForm();

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response =
        await api.post<CreateGenerationResponse>(
          "/generations",
          {
            ...formData,
            topic: formData.topic.trim(),
            subject: formData.subject.trim(),
          },
        );

      setSuccessMessage(response.data.message);
      setCreatedJobId(response.data.job.id);
      setFormData(initialFormData);
    } catch (error: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        const message = error.response?.data?.message;

        if (Array.isArray(message)) {
          setErrors(message);
        } else if (typeof message === "string") {
          setErrors([message]);
        } else if (!error.response) {
          setErrors([
            "Unable to connect to the backend. Make sure NestJS is running.",
          ]);
        } else {
          setErrors([
            "The generation request could not be created.",
          ]);
        }
      } else {
        setErrors(["An unexpected error occurred"]);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-4xl">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          AI note generator
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Generate study notes
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Choose the content, education level and study resources
          you want StudyFlow AI to prepare.
        </p>
      </div>

      {errors.length > 0 && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5"
        >
          <p className="font-semibold text-red-800">
            Please correct the following:
          </p>

          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-red-700">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5"
        >
          <p className="font-semibold text-green-800">
            {successMessage}
          </p>

          <p className="mt-1 text-sm text-green-700">
            Job status: PENDING
          </p>

          {createdJobId && (
            <p className="mt-1 break-all text-xs text-green-700">
              Request ID: {createdJobId}
            </p>
          )}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-7 space-y-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="topic"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Topic
            </label>

            <input
              id="topic"
              type="text"
              required
              maxLength={200}
              value={formData.topic}
              onChange={(event) =>
                updateField("topic", event.target.value)
              }
              placeholder="Example: Database Normalization"
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="subject"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Subject
            </label>

            <input
              id="subject"
              type="text"
              required
              maxLength={120}
              value={formData.subject}
              onChange={(event) =>
                updateField("subject", event.target.value)
              }
              placeholder="Example: Databases"
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="educationLevel"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Education level
            </label>

            <select
              id="educationLevel"
              value={formData.educationLevel}
              onChange={(event) =>
                updateField(
                  "educationLevel",
                  event.target
                    .value as GenerationFormData["educationLevel"],
                )
              }
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
            >
              <option value="SCHOOL">School</option>
              <option value="COLLEGE">College</option>
              <option value="UNIVERSITY">University</option>
              <option value="PROFESSIONAL">
                Professional
              </option>
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
              value={formData.language}
              onChange={(event) =>
                updateField(
                  "language",
                  event.target
                    .value as GenerationFormData["language"],
                )
              }
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
            >
              <option value="ENGLISH">English</option>
              <option value="URDU">Urdu</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="notesLength"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Notes length
            </label>

            <select
              id="notesLength"
              value={formData.notesLength}
              onChange={(event) =>
                updateField(
                  "notesLength",
                  event.target
                    .value as GenerationFormData["notesLength"],
                )
              }
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
            >
              <option value="SHORT">Short</option>
              <option value="MEDIUM">Medium</option>
              <option value="LONG">Long</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="numberOfMcqs"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Number of MCQs
            </label>

            <input
              id="numberOfMcqs"
              type="number"
              min={0}
              max={50}
              step={1}
              value={formData.numberOfMcqs}
              onChange={(event) =>
                updateField(
                  "numberOfMcqs",
                  Number(event.target.value),
                )
              }
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="numberOfFlashcards"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Number of flashcards
            </label>

            <input
              id="numberOfFlashcards"
              type="number"
              min={0}
              max={50}
              step={1}
              value={formData.numberOfFlashcards}
              onChange={(event) =>
                updateField(
                  "numberOfFlashcards",
                  Number(event.target.value),
                )
              }
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50">
            <input
              type="checkbox"
              checked={formData.includePracticalExamples}
              onChange={(event) =>
                updateField(
                  "includePracticalExamples",
                  event.target.checked,
                )
              }
              disabled={isSubmitting}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600"
            />

            <span>
              <span className="block text-sm font-semibold text-slate-800">
                Include practical examples
              </span>

              <span className="mt-1 block text-xs leading-5 text-slate-500">
                Add real-world explanations and examples to the
                generated notes.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50">
            <input
              type="checkbox"
              checked={formData.sendToWhatsapp}
              onChange={(event) =>
                updateField(
                  "sendToWhatsapp",
                  event.target.checked,
                )
              }
              disabled={isSubmitting}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600"
            />

            <span>
              <span className="block text-sm font-semibold text-slate-800">
                Send to WhatsApp
              </span>

              <span className="mt-1 block text-xs leading-5 text-slate-500">
                Store a delivery request for the generated study
                material.
              </span>
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {isSubmitting
            ? "Creating generation request..."
            : "Generate study notes"}
        </button>
      </form>
    </section>
  );
}