"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import Link from "next/link";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { RoleBadge } from "@/components/RoleBadge";
import { ShareDialog } from "@/components/ShareDialog";
import { editorExtensions } from "@/lib/editor";
import type { DocumentDetail, Share } from "@/lib/types";
import { Toolbar } from "./Toolbar";
import { type SaveStatus, useDocumentSaver } from "./useDocumentSaver";

const AUTOSAVE_DELAY_MS = 800;

const STATUS_TEXT: Record<SaveStatus, string> = {
  saved: "All changes saved",
  unsaved: "Unsaved changes",
  saving: "Saving…",
  error: "Could not save",
  conflict: "Not saved: newer version exists",
};

export function DocumentEditor({ doc }: { doc: DocumentDetail }) {
  const canEdit = doc.role !== "viewer";
  const isOwner = doc.role === "owner";

  const { status, errorMessage, save, markUnsaved } = useDocumentSaver(doc.id, doc.version);
  const [title, setTitle] = useState(doc.title);
  const savedTitle = useRef(doc.title);
  const [shares, setShares] = useState<Share[]>(doc.shares);
  const [shareOpen, setShareOpen] = useState(false);

  // Autosave: wait until the user pauses typing, then save the whole document.
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: editorExtensions,
    content: doc.content,
    editable: canEdit,
    immediatelyRender: false, // required with server-side rendering in Next.js
    editorProps: { attributes: { "aria-label": "Document content" } },
    onUpdate: ({ editor }) => {
      markUnsaved();
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(() => {
        autosaveTimer.current = null;
        save({ content: editor.getJSON() });
      }, AUTOSAVE_DELAY_MS);
    },
  });

  // If the user leaves the page before the autosave timer fires, save right away.
  useEffect(() => {
    return () => {
      if (autosaveTimer.current && editor && !editor.isDestroyed) {
        clearTimeout(autosaveTimer.current);
        save({ content: editor.getJSON() });
      }
    };
  }, [editor, save]);

  // Warn before closing the tab while changes are still being saved.
  useEffect(() => {
    const hasUnsavedWork = status === "unsaved" || status === "saving";
    if (!hasUnsavedWork) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [status]);

  useEffect(() => {
    document.title = `${title || "Untitled"} - Ajaia Docs`;
  }, [title]);

  async function commitTitle() {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(savedTitle.current); // an empty title is not allowed, so restore the last one
      return;
    }
    setTitle(trimmed);
    if (trimmed === savedTitle.current) return;

    const updated = await save({ title: trimmed });
    if (updated) savedTitle.current = updated.title;
  }

  function onTitleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") e.currentTarget.blur();
    if (e.key === "Escape") {
      setTitle(savedTitle.current);
      requestAnimationFrame(() => (e.target as HTMLInputElement).blur());
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2">
          <Link href="/documents" className="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100">
            ← Documents
          </Link>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={onTitleKeyDown}
            readOnly={!canEdit}
            maxLength={200}
            aria-label="Document title"
            className="min-w-0 flex-1 rounded border border-transparent px-2 py-1 text-lg font-medium hover:border-slate-200 focus:border-blue-500 focus:outline-none read-only:hover:border-transparent"
          />
          {canEdit && (
            <span
              role="status"
              className={`whitespace-nowrap text-xs ${status === "error" || status === "conflict" ? "text-red-600" : "text-slate-500"}`}
            >
              {STATUS_TEXT[status]}
            </span>
          )}
          <RoleBadge role={doc.role} />
          {isOwner ? (
            <button
              onClick={() => setShareOpen(true)}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Share
            </button>
          ) : (
            <span className="hidden whitespace-nowrap text-xs text-slate-500 sm:inline">
              Shared by {doc.owner.name}
            </span>
          )}
        </div>
        {canEdit && editor && <Toolbar editor={editor} />}
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {!canEdit && (
          <p className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            You have view-only access. Ask {doc.owner.name} for edit access if you need to make changes.
          </p>
        )}
        {status === "conflict" && (
          <div
            role="alert"
            className="mb-4 flex items-center justify-between gap-3 rounded-md bg-red-50 p-3 text-sm text-red-700"
          >
            <span>Someone else saved this document while you were editing. Reload to see the latest version.</span>
            <button
              onClick={() => window.location.reload()}
              className="rounded bg-red-600 px-3 py-1 font-medium text-white hover:bg-red-700"
            >
              Reload
            </button>
          </div>
        )}
        {status === "error" && errorMessage && (
          <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {errorMessage} Your next change will try saving again.
          </p>
        )}

        <div className="rounded-lg border border-slate-200 bg-white px-8 py-10 shadow-sm sm:px-16">
          <EditorContent editor={editor} />
        </div>
      </main>

      {shareOpen && (
        <ShareDialog
          documentId={doc.id}
          documentTitle={title}
          owner={doc.owner}
          shares={shares}
          onSharesChange={setShares}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
