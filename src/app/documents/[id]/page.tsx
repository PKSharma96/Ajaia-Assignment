"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DocumentEditor } from "@/components/editor/DocumentEditor";
import { Spinner } from "@/components/ui/Spinner";
import { ApiError, api } from "@/lib/api";
import type { DocumentDetail } from "@/lib/types";

export default function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getDocument(id)
      .then(setDoc)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setError("This document does not exist, or it has not been shared with you.");
        } else {
          setError(err instanceof ApiError ? err.message : "Could not load the document.");
        }
      });
  }, [id]);

  if (error) {
    return (
      <main className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">Cannot open document</h1>
        <p className="mt-2 text-sm text-slate-600">{error}</p>
        <Link href="/documents" className="mt-6 inline-block text-sm font-medium text-blue-600 hover:underline">
          ← Back to documents
        </Link>
      </main>
    );
  }

  if (!doc) {
    return <Spinner label="Loading document…" className="py-24" />;
  }

  return <DocumentEditor doc={doc} />;
}
