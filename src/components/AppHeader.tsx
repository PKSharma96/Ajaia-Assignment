"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

export function AppHeader({ user }: { user: User | null }) {
  const router = useRouter();

  async function logout() {
    await api.logout().catch(() => {});
    router.push("/login");
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/documents" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-blue-600 text-sm text-white">A</span>
          Ajaia Docs
        </Link>
        {user && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-600">
              Signed in as <span className="font-medium text-slate-900">{user.name}</span>
            </span>
            <button onClick={logout} className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100">
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
