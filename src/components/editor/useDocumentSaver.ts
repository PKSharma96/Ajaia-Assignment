"use client";

import type { JSONContent } from "@tiptap/react";
import { useCallback, useRef, useState } from "react";
import { ApiError, api } from "@/lib/api";
import type { DocumentDetail } from "@/lib/types";

export type SaveStatus = "saved" | "unsaved" | "saving" | "error" | "conflict";

interface Changes {
  title?: string;
  content?: JSONContent;
}

/**
 * Saves changes one at a time, always sending the latest known `version`.
 *
 * - Saves are queued so a rename and an autosave never race each other.
 * - If the server answers 409 (someone else saved first), we stop saving and
 *   ask the user to reload, instead of silently overwriting their work.
 */
export function useDocumentSaver(documentId: string, initialVersion: number) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const version = useRef(initialVersion);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const pendingSaves = useRef(0);
  const hasConflict = useRef(false);

  const save = useCallback(
    (changes: Changes): Promise<DocumentDetail | null> => {
      if (hasConflict.current) return Promise.resolve(null);

      pendingSaves.current += 1;
      setStatus("saving");

      const run = async () => {
        try {
          const updated = await api.updateDocument(documentId, { ...changes, version: version.current });
          version.current = updated.version;
          pendingSaves.current -= 1;
          if (pendingSaves.current === 0) {
            setStatus("saved");
            setErrorMessage(null);
          }
          return updated;
        } catch (err) {
          pendingSaves.current -= 1;
          if (err instanceof ApiError && err.status === 409) {
            hasConflict.current = true;
            setStatus("conflict");
          } else {
            setStatus("error");
          }
          setErrorMessage(err instanceof Error ? err.message : "Could not save your changes.");
          return null;
        }
      };

      const result = queue.current.then(run);
      queue.current = result;
      return result;
    },
    [documentId],
  );

  const markUnsaved = useCallback(() => {
    if (!hasConflict.current) setStatus("unsaved");
  }, []);

  return { status, errorMessage, save, markUnsaved };
}
