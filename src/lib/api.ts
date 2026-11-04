import type { JSONContent } from "@tiptap/react";
import type { DocumentDetail, DocumentSummary, Share, ShareRole, User } from "./types";

/** An error from the API, with a message that is safe to show to the user. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const navigation = {
  toLogin() {
    if (typeof window === "undefined") return;
    // A full page load (not router.push) so no data from the expired session stays in memory.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login");
  },
};

const SERVER_UNAVAILABLE =
  "The server is not responding right now. It may be waking up, so please try again in a moment.";

/** Reads `{ error }` from the response, or falls back to a friendly message. */
export async function readErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.error === "string") return data.error;
  } catch {
    // Not JSON, e.g. an HTML error page from a proxy.
  }
  if (res.status >= 500) return SERVER_UNAVAILABLE;
  return `Request failed (${res.status})`;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isFormData = init.body instanceof FormData;

  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      credentials: "same-origin",
      headers: isFormData ? init.headers : { "Content-Type": "application/json", ...init.headers },
    });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Check your connection and try again.");
  }

  // Session missing or expired: send the user to the login page (except while logging in).
  if (res.status === 401 && path !== "/auth/login") {
    navigation.toLogin();
  }

  if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const json = (body: unknown) => JSON.stringify(body);

export const api = {
  health: () => request<{ status: string }>("/health"),

  demoUsers: () => request<{ users: User[] }>("/auth/demo-users"),
  login: (email: string) => request<{ user: User }>("/auth/login", { method: "POST", body: json({ email }) }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  me: () => request<{ user: User }>("/auth/me"),

  listDocuments: () => request<{ owned: DocumentSummary[]; shared: DocumentSummary[] }>("/documents"),
  createDocument: (title?: string) =>
    request<DocumentDetail>("/documents", { method: "POST", body: json(title ? { title } : {}) }),
  getDocument: (id: string) => request<DocumentDetail>(`/documents/${id}`),
  updateDocument: (id: string, changes: { title?: string; content?: JSONContent; version: number }) =>
    request<DocumentDetail>(`/documents/${id}`, { method: "PATCH", body: json(changes) }),
  deleteDocument: (id: string) => request<void>(`/documents/${id}`, { method: "DELETE" }),
  importDocument: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<DocumentDetail>("/documents/import", { method: "POST", body: form });
  },

  addShare: (id: string, email: string, role: ShareRole) =>
    request<{ shares: Share[] }>(`/documents/${id}/shares`, { method: "POST", body: json({ email, role }) }),
  updateShare: (id: string, userId: string, role: ShareRole) =>
    request<{ shares: Share[] }>(`/documents/${id}/shares/${userId}`, { method: "PATCH", body: json({ role }) }),
  removeShare: (id: string, userId: string) =>
    request<{ shares: Share[] }>(`/documents/${id}/shares/${userId}`, { method: "DELETE" }),
};
