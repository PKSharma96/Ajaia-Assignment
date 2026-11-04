"use client";

import { type ChangeEvent, useRef, useState } from "react";
import { ApiError, api } from "@/lib/api";
import type { DocumentDetail } from "@/lib/types";
import { SUPPORTED_EXTENSIONS, validateUploadFile } from "@/lib/upload";

interface Props {
  onImported: (doc: DocumentDetail) => void;
  onError: (message: string) => void;
}

/** Uploads a .txt, .md or .docx file and turns it into a new document. */
export function ImportButton({ onImported, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onFileChosen(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow choosing the same file again
    if (!file) return;

    const problem = validateUploadFile(file);
    if (problem) {
      onError(problem);
      return;
    }

    setUploading(true);
    try {
      onImported(await api.importDocument(file));
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={SUPPORTED_EXTENSIONS.join(",")}
        onChange={onFileChosen}
        className="hidden"
        data-testid="import-input"
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        {uploading ? "Importing…" : "Import file"}
      </button>
    </>
  );
}
