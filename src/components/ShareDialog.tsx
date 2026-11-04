"use client";

import { type FormEvent, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import type { Share, ShareRole, User } from "@/lib/types";

interface Props {
  documentId: string;
  documentTitle: string;
  owner: User;
  shares: Share[];
  onSharesChange: (shares: Share[]) => void;
  onClose: () => void;
}

/** Owner-only dialog to give, change or remove access to a document. */
export function ShareDialog({ documentId, documentTitle, owner, shares, onSharesChange, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ShareRole>("EDITOR");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);

  useEffect(() => {
    api
      .demoUsers()
      .then(({ users }) => setDemoUsers(users))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // Suggest demo users who do not have access yet.
  const suggestions = demoUsers.filter((u) => u.id !== owner.id && !shares.some((s) => s.userId === u.id));

  async function run(action: () => Promise<{ shares: Share[] }>) {
    setError(null);
    setBusy(true);
    try {
      const result = await action();
      onSharesChange(result.shares);
      return true;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) {
      setError("Enter the email of the person you want to share with.");
      return;
    }
    if (await run(() => api.addShare(documentId, email.trim(), role))) setEmail("");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="share-title" className="text-lg font-semibold">
            Share “{documentTitle}”
          </h2>
          <button onClick={onClose} aria-label="Close" className="rounded px-2 text-slate-500 hover:bg-slate-100">
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 flex flex-wrap gap-2">
          <input
            type="email"
            list="share-suggestions"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email, e.g. carol@ajaia.dev"
            aria-label="Email to share with"
            className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <datalist id="share-suggestions">
            {suggestions.map((u) => (
              <option key={u.id} value={u.email}>
                {u.name}
              </option>
            ))}
          </datalist>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as ShareRole)}
            aria-label="Access level"
            className="rounded-md border border-slate-300 px-2 py-2 text-sm"
          >
            <option value="EDITOR">Can edit</option>
            <option value="VIEWER">Can view</option>
          </select>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            Share
          </button>
        </form>

        {error && (
          <p role="alert" className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <h3 className="mt-6 text-sm font-medium text-slate-700">People with access</h3>
        <ul className="mt-2 divide-y divide-slate-100">
          <li className="flex items-center justify-between py-2 text-sm">
            <span>
              <span className="font-medium">{owner.name}</span> <span className="text-slate-500">{owner.email}</span>
            </span>
            <span className="text-slate-500">Owner</span>
          </li>
          {shares.map((share) => (
            <li key={share.userId} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span className="min-w-0 truncate">
                <span className="font-medium">{share.name}</span> <span className="text-slate-500">{share.email}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <select
                  value={share.role}
                  disabled={busy}
                  onChange={(e) => run(() => api.updateShare(documentId, share.userId, e.target.value as ShareRole))}
                  aria-label={`Access level for ${share.name}`}
                  className="rounded border border-slate-200 px-1 py-1 text-sm"
                >
                  <option value="EDITOR">Can edit</option>
                  <option value="VIEWER">Can view</option>
                </select>
                <button
                  disabled={busy}
                  onClick={() => run(() => api.removeShare(documentId, share.userId))}
                  aria-label={`Remove ${share.name}`}
                  className="rounded px-2 py-1 text-slate-500 hover:bg-red-50 hover:text-red-600"
                >
                  Remove
                </button>
              </span>
            </li>
          ))}
        </ul>
        {shares.length === 0 && <p className="mt-1 text-sm text-slate-500">Only you can open this document.</p>}
      </div>
    </div>
  );
}
