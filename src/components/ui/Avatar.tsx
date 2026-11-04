const COLORS = ["bg-blue-600", "bg-emerald-600", "bg-violet-600", "bg-amber-600", "bg-rose-600"];

/** A circle with the person's initials. The colour is picked from the name, so it stays the same everywhere. */
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const color = COLORS[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % COLORS.length];
  const sizeClass = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${color} ${sizeClass}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
