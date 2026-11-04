"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { DocumentList } from "@/components/DocumentList";
import { ImportButton } from "@/components/ImportButton";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ApiError, api } from "@/lib/api";
import type { DocumentSummary } from "@/lib/types";
import { useCurrentUser } from "@/lib/useCurrentUser";

interface DocumentLists {
  owned: DocumentSummary[];
  shared: DocumentSummary[];
}

export default function DashboardPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const [lists, setLists] = useState<DocumentLists | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api
      .listDocuments()
      .then(setLists)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load your documents."));
  }, []);

  async function createDocument() {
    setError(null);
    setCreating(true);
    try {
      const doc = await api.createDocument();
      router.push(`/documents/${doc.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create a document.");
      setCreating(false);
    }
  }

  async function deleteDocument(doc: DocumentSummary) {
    if (!window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    setError(null);
    try {
      await api.deleteDocument(doc.id);
      setLists(await api.listDocuments());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete the document.");
    }
  }

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Documents</h1>
            <p className="mt-1 text-sm text-slate-500">Import supports .txt, .md and .docx files up to 2 MB.</p>
          </div>
          <div className="flex gap-2">
            <ImportButton
              onImported={(doc) => router.push(`/documents/${doc.id}`)}
              onError={(message) => setError(message)}
            />
            <Button onClick={createDocument} disabled={creating}>
              {creating ? "Creating…" : "+ New document"}
            </Button>
          </div>
        </div>

        {error && (
          <Alert
            className="mt-6"
            action={
              <Button variant="ghost" size="sm" onClick={() => setError(null)} aria-label="Dismiss">
                ✕
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {!lists && !error && <Spinner label="Loading documents…" className="mt-12" />}

        {lists && (
          <>
            <DocumentList
              heading="My documents"
              documents={lists.owned}
              emptyText="You have no documents yet. Create one or import a file to get started."
              onDelete={deleteDocument}
            />
            <DocumentList
              heading="Shared with me"
              documents={lists.shared}
              emptyText="Nothing has been shared with you yet."
              showOwner
            />
          </>
        )}
      </main>
    </>
  );
}
