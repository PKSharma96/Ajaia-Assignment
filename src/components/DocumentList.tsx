import Link from "next/link";
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
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
              <Link href={`/documents/${doc.id}`} className="min-w-0 flex-1">
                <span className="block truncate font-medium text-slate-900">{doc.title}</span>
                <span className="block text-xs text-slate-500">
                  {showOwner && <>Owned by {doc.owner.name} · </>}
                  Edited {formatDate(doc.updatedAt)}
                </span>
              </Link>
              <RoleBadge role={doc.role} />
              {onDelete && (
                <button
                  onClick={() => onDelete(doc)}
                  className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Delete ${doc.title}`}
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
