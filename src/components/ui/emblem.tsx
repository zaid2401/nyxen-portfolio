import { cn } from "@/lib/utils";

/**
 * The NYXEN mark.
 *
 * A cut-corner frame containing an abstract N drawn as a single unbroken
 * stroke — deliberately geometric rather than typographic, so it reads as a
 * device rather than a wordmark.
 *
 * REPLACE ME: drop your own emblem in here (or swap the <svg> for an <Image>
 * pointing at /public). Everything else references this component, so the
 * whole site picks up the change.
 */
export function Emblem({
  className,
  live = false,
}: {
  className?: string;
  /** Draws the status pip. Used in the header to signal "system online". */
  live?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("h-full w-full", className)}
    >
      {/* Frame: corners cut on the top-left and bottom-right diagonal. */}
      <path
        d="M9.5 2.5H29.5V22.5L22.5 29.5H2.5V9.5L9.5 2.5Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
        opacity="0.55"
      />
      {/* The N: up, diagonal down, up. One continuous stroke. */}
      <path
        d="M11 22V10.5L21 21.5V10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {live && <circle cx="25.5" cy="6.5" r="1.75" fill="currentColor" />}
    </svg>
  );
}

/** Emblem + wordmark, locked up. */
export function Wordmark({
  className,
  live = false,
}: {
  className?: string;
  live?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="text-accent h-7 w-7 shrink-0">
        <Emblem live={live} />
      </span>
      <span className="font-mono text-[0.9375rem] font-medium tracking-[0.28em] uppercase">
        Nyxen
      </span>
    </span>
  );
}
