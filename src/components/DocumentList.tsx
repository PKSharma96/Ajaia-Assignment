import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";
import type { DocumentSummary } from "@/lib/types";
import { RoleBadge } from "./RoleBadge";

interface Props {
  heading: string;
  documents: DocumentSummary[];
  emptyText: string;
  showOwner?: boolean;
  onDelete?: (doc: DocumentSummary) => void;
}

const DocumentIcon = () => (
  <span
    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600"
    aria-hidden="true"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </svg>
  </span>
);

export function DocumentList({ heading, documents, emptyText, showOwner = false, onDelete }: Props) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {heading} <span className="font-normal">({documents.length})</span>
      </h2>

      {documents.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          {emptyText}
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50">
              <Link href={`/documents/${doc.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <DocumentIcon />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-slate-900">{doc.title}</span>
                  <span className="block text-xs text-slate-500">
                    {showOwner && <>Owned by {doc.owner.name} · </>}
                    Edited {formatDate(doc.updatedAt)}
                  </span>
                </span>
              </Link>
              <RoleBadge role={doc.role} />
              {onDelete && (
                <Button variant="dangerText" size="sm" onClick={() => onDelete(doc)} aria-label={`Delete ${doc.title}`}>
                  Delete
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
