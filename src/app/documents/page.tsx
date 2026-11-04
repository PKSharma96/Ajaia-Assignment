"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { DocumentList } from "@/components/DocumentList";
import { ImportButton } from "@/components/ImportButton";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { ApiError, api } from "@/lib/api";
import type { DocumentSummary } from "@/lib/types";
import { useCurrentUser } from "@/lib/useCurrentUser";

interface DocumentLists {
  owned: DocumentSummary[];
  shared: DocumentSummary[];
}

const errorText = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback);

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const user = useCurrentUser();
  const [lists, setLists] = useState<DocumentLists | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [docToDelete, setDocToDelete] = useState<DocumentSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api
      .listDocuments()
      .then(setLists)
      .catch((err) => setLoadError(errorText(err, "Could not load your documents.")));
  }, []);

  async function createDocument() {
    setCreating(true);
    try {
      const doc = await api.createDocument();
      router.push(`/documents/${doc.id}`);
    } catch (err) {
      toast.error(errorText(err, "Could not create a document."));
      setCreating(false);
    }
  }

  async function confirmDelete() {
    if (!docToDelete) return;
    setDeleting(true);
    try {
      await api.deleteDocument(docToDelete.id);
      toast.success(`Deleted “${docToDelete.title}”`);
      setLists(await api.listDocuments());
    } catch (err) {
      toast.error(errorText(err, "Could not delete the document."));
    } finally {
      setDeleting(false);
      setDocToDelete(null);
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
            <ImportButton onImported={(doc) => router.push(`/documents/${doc.id}`)} />
            <Button onClick={createDocument} disabled={creating}>
              {creating ? "Creating…" : "+ New document"}
            </Button>
          </div>
        </div>

        {loadError && (
          <Alert
            className="mt-6"
            action={
              <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
                Try again
              </Button>
            }
          >
            {loadError}
          </Alert>
        )}

        {!lists && !loadError && <Spinner label="Loading documents…" className="mt-12" />}

        {lists && (
          <>
            <DocumentList
              heading="My documents"
              documents={lists.owned}
              emptyText="You have no documents yet. Create one or import a file to get started."
              onDelete={setDocToDelete}
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

      {docToDelete && (
        <ConfirmDialog
          title="Delete document?"
          message={
            <>“{docToDelete.title}” will be deleted for you and everyone it is shared with. This cannot be undone.</>
          }
          confirmLabel="Delete"
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDocToDelete(null)}
        />
      )}
    </>
  );
}
