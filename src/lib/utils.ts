/** Tiny class joiner. Deliberately not clsx — this is all it ever needs to do. */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/** "12 Mar 2026" — stable across locales so server and client HTML match. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "Not available";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Deterministic small hash — used to vary animation offsets without Math.random. */
export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** True in `next dev`. Used to surface placeholder badges to the author only. */
export const isDev = process.env.NODE_ENV === "development";
