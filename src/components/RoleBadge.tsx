import { ROLE_LABELS } from "@/lib/format";
import type { Role } from "@/lib/types";

const COLORS: Record<Role, string> = {
  owner: "bg-blue-50 text-blue-700 ring-blue-200",
  editor: "bg-green-50 text-green-700 ring-green-200",
  viewer: "bg-amber-50 text-amber-700 ring-amber-200",
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${COLORS[role]}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}
