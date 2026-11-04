import type { Role } from "./types";

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  editor: "Can edit",
  viewer: "Can view",
};
