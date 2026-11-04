"use client";

import { type ChangeEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ApiError, api } from "@/lib/api";
import type { DocumentDetail } from "@/lib/types";
import { SUPPORTED_EXTENSIONS, validateUploadFile } from "@/lib/upload";

/** Uploads a .txt, .md or .docx file, turns it into a new document and reports the result as a toast. */
export function ImportButton({ onImported }: { onImported: (doc: DocumentDetail) => void }) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onFileChosen(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow choosing the same file again
    if (!file) return;

    const problem = validateUploadFile(file);
    if (problem) {
      toast.error(problem);
      return;
    }

    setUploading(true);
    try {
      const doc = await api.importDocument(file);
      toast.success(`Imported “${doc.title}”`);
      onImported(doc);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Upload failed. Please try again.");
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
      <Button
        variant="secondary"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        title={`Supported: ${SUPPORTED_EXTENSIONS.join(", ")} (max 2 MB)`}
      >
        {uploading ? "Importing…" : "Import file"}
      </Button>
    </>
  );
}
