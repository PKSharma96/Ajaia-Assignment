"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ApiError, api } from "@/lib/api";
import type { User } from "@/lib/types";

type ServerState = "connecting" | "waking" | "ready" | "down";

const RETRY_DELAY_MS = 3000;
const MAX_ATTEMPTS = 30; // about 90 seconds, enough for a free-tier server to wake up

export default function LoginPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [serverState, setServerState] = useState<ServerState>("connecting");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyEmail, setBusyEmail] = useState<string | null>(null);

  // Load the demo accounts. Keep retrying while the backend wakes up from sleep.
  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout>;

    async function connect(attempt: number) {
      try {
        const { users } = await api.demoUsers();
        if (cancelled) return;
        setUsers(users);
        setServerState("ready");
      } catch {
        if (cancelled) return;
        if (attempt >= MAX_ATTEMPTS) {
          setServerState("down");
          return;
        }
        setServerState("waking");
        retryTimer = setTimeout(() => connect(attempt + 1), RETRY_DELAY_MS);
      }
    }

    connect(1);
    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
    };
  }, []);

  async function login(loginEmail: string) {
    setError(null);
    setBusyEmail(loginEmail);
    try {
      await api.login(loginEmail);
      router.push("/documents");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed. Please try again.");
      setBusyEmail(null);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) {
      setError("Please enter an email address.");
      return;
    }
    login(email.trim());
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 font-semibold text-white">
            A
          </span>
          <h1 className="text-xl font-semibold">Ajaia Docs</h1>
        </div>

        <h2 className="text-lg font-medium">Sign in with a demo account</h2>
        <p className="mt-1 text-sm text-slate-600">
          This demo uses mocked authentication: pick an account, no password needed. Use two different browsers (or a
          private window) to try sharing between users.
        </p>

        {serverState === "connecting" && <Spinner label="Connecting to the server…" className="mt-6" />}
        {serverState === "waking" && (
          <Alert tone="warning" className="mt-6">
            The free server is waking up. This can take up to a minute, and the page will continue on its own.
          </Alert>
        )}
        {serverState === "down" && (
          <Alert className="mt-6">Could not reach the server. Please refresh the page to try again.</Alert>
        )}

        {users.length > 0 && (
          <ul className="mt-6 space-y-2">
            {users.map((user) => (
              <li key={user.id}>
                <button
                  onClick={() => login(user.email)}
                  disabled={busyEmail !== null}
                  className="flex w-full items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-left transition-colors hover:border-blue-400 hover:bg-blue-50 disabled:opacity-60"
                >
                  <Avatar name={user.name} />
                  <span className="flex-1">
                    <span className="block font-medium">{user.name}</span>
                    <span className="block text-sm text-slate-500">{user.email}</span>
                  </span>
                  <span className="text-sm text-blue-600">
                    {busyEmail === user.email ? "Signing in…" : "Sign in →"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={onSubmit} className="mt-6 border-t border-slate-100 pt-6">
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Or enter a demo email
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alice@ajaia.dev"
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <Button type="submit" disabled={busyEmail !== null}>
              Sign in
            </Button>
          </div>
        </form>

        {error && <Alert className="mt-4">{error}</Alert>}
      </div>
    </main>
  );
}
