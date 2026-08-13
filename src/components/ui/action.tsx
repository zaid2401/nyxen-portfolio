import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "quiet";

const base =
  "group relative inline-flex items-center justify-center gap-2.5 overflow-hidden " +
  "border px-5 py-3 font-mono text-[0.6875rem] uppercase tracking-[0.16em] " +
  "transition-colors duration-300 outline-none " +
  "disabled:cursor-not-allowed disabled:opacity-45";

const variants: Record<Variant, string> = {
  primary:
    "border-accent-line text-accent bg-accent/[0.06] hover:bg-accent/[0.12] hover:border-accent",
  ghost:
    "border-line-strong text-fg hover:border-accent-line hover:text-accent",
  quiet: "border-transparent text-muted hover:text-fg",
};

/** Diagonal sheen that crosses the button once on hover. Purely a hover cue. */
function Sheen() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-18deg] bg-white/[0.07] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-[220%] motion-reduce:hidden"
    />
  );
}

export function ActionButton({
  children,
  variant = "ghost",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      <Sheen />
      <span className="relative flex items-center gap-2.5">{children}</span>
    </button>
  );
}

/**
 * Links. External destinations are detected from the href and always get
 * `rel="noopener noreferrer"` plus a screen-reader note that they open a new
 * tab — there is no way to forget it at a call site.
 */
export function ActionLink({
  href,
  children,
  variant = "ghost",
  className,
  external,
  ...props
}: Omit<ComponentProps<"a">, "href"> & {
  href: string;
  variant?: Variant;
  external?: boolean;
}) {
  const isExternal = external ?? /^https?:\/\//i.test(href);

  return (
    <a
      href={href}
      className={cn(base, variants[variant], className)}
      {...(isExternal
        ? { target: "_blank", rel: "noopener noreferrer" }
        : undefined)}
      {...props}
    >
      <Sheen />
      <span className="relative flex items-center gap-2.5">
        {children}
        {isExternal && <span className="sr-only">(opens in a new tab)</span>}
      </span>
    </a>
  );
}

/** Metadata chip: language, topic, stack item. */
export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "iris";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[0.625rem] tracking-[0.1em] uppercase",
        tone === "neutral" && "border-line text-muted",
        tone === "accent" && "border-accent-line text-accent bg-accent/[0.05]",
        tone === "iris" && "border-iris/35 text-iris bg-iris/[0.05]",
        className,
      )}
    >
      {children}
    </span>
  );
}
