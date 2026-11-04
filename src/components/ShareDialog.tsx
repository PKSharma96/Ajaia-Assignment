"use client";

import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ApiError, api } from "@/lib/api";
import type { Share, ShareRole, User } from "@/lib/types";

function RoleSelect({
  value,
  onChange,
  label,
  disabled = false,
}: {
  value: ShareRole;
  onChange: (role: ShareRole) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as ShareRole)}
      aria-label={label}
      className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
    >
      <option value="EDITOR">Can edit</option>
      <option value="VIEWER">Can view</option>
    </select>
  );
}

function PersonRow({ name, email, children }: { name: string; email: string; children: ReactNode }) {
  return (
    <li className="flex items-center gap-3 py-2 text-sm">
      <Avatar name={name} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{name}</span>
        <span className="block truncate text-xs text-slate-500">{email}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1">{children}</span>
    </li>
  );
}

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
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard?.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 flex flex-wrap gap-2">
          <input
            type="email"
            list="share-suggestions"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email, e.g. carol@ajaia.dev"
            aria-label="Email to share with"
            autoFocus
            className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <datalist id="share-suggestions">
            {suggestions.map((u) => (
              <option key={u.id} value={u.email}>
                {u.name}
              </option>
            ))}
          </datalist>
          <RoleSelect value={role} onChange={setRole} label="Access level" />
          <Button type="submit" disabled={busy}>
            Share
          </Button>
        </form>

        {error && <Alert className="mt-3">{error}</Alert>}

        <h3 className="mt-6 text-sm font-medium text-slate-700">People with access</h3>
        <ul className="mt-2 divide-y divide-slate-100">
          <PersonRow name={owner.name} email={owner.email}>
            <span className="text-slate-500">Owner</span>
          </PersonRow>
          {shares.map((share) => (
            <PersonRow key={share.userId} name={share.name} email={share.email}>
              <RoleSelect
                value={share.role}
                disabled={busy}
                onChange={(newRole) => run(() => api.updateShare(documentId, share.userId, newRole))}
                label={`Access level for ${share.name}`}
              />
              <Button
                variant="danger"
                size="sm"
                disabled={busy}
                onClick={() => run(() => api.removeShare(documentId, share.userId))}
                aria-label={`Remove ${share.name}`}
              >
                Remove
              </Button>
            </PersonRow>
          ))}
        </ul>
        {shares.length === 0 && <p className="mt-1 text-sm text-slate-500">Only you can open this document.</p>}

        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <Button variant="secondary" size="sm" onClick={copyLink}>
            {copied ? "Link copied ✓" : "Copy link"}
          </Button>
          <Button size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
