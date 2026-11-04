import type { JSONContent } from "@tiptap/react";

/** These mirror the JSON returned by the Express API. */

export type Role = "owner" | "editor" | "viewer";
export type ShareRole = "VIEWER" | "EDITOR";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface DocumentSummary {
  id: string;
  title: string;
  updatedAt: string;
  owner: User;
  role: Role;
}

export interface Share {
  userId: string;
  name: string;
  email: string;
  role: ShareRole;
}

export interface DocumentDetail {
  id: string;
  title: string;
  content: JSONContent;
  version: number;
  createdAt: string;
  updatedAt: string;
  owner: User;
  role: Role;
  shares: Share[];
}
