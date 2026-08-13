import { isPlaceholder } from "@/config/site";
import { cn, isDev } from "@/lib/utils";

/**
 * Development-only marker for content that still needs replacing.
 *
 * Recruiters never see this — it is compiled out of production by the
 * `isDev` check — but while you are editing the data files, every unreplaced
 * value announces itself.
 */
export function PlaceholderBadge({ className }: { className?: string }) {
  if (!isDev) return null;
  return (
    <span
      className={cn(
        "border-warn/40 text-warn/90 ml-1.5 inline-block translate-y-[-1px] border px-1 py-px align-middle font-mono text-[0.5625rem] leading-none tracking-[0.14em] uppercase",
        className,
      )}
    >
      todo
    </span>
  );
}

/**
 * Renders a config/data string and flags it when it is still a placeholder.
 * Use this anywhere a value comes straight from `site.ts` or `/data`.
 */
export function Placeholderable({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const pending = isPlaceholder(value);
  return (
    <span className={cn(pending && isDev && "text-warn/90", className)}>
      {value}
      {pending && <PlaceholderBadge />}
    </span>
  );
}

/** Consistent treatment for data an API genuinely did not provide. */
export function NotAvailable({ className }: { className?: string }) {
  return (
    <span className={cn("text-dim font-mono text-xs italic", className)}>
      Not available
    </span>
  );
}
