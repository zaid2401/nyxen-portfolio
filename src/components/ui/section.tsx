import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { SectionId } from "@/config/site";

/**
 * Every section on the page is a landmark with an accessible name, an index
 * number and a rule line. The consistency is the design — nothing here is
 * decorative for its own sake.
 */
export function Section({
  id,
  index,
  title,
  kicker,
  children,
  className,
  contentClassName,
  bleed = false,
}: {
  id: SectionId;
  /** Zero-padded index rendered beside the title, e.g. "03". */
  index: string;
  title: string;
  /** One line of context under the title. Optional. */
  kicker?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  /** Lets a child break out of the content column (used by the constellation). */
  bleed?: boolean;
}) {
  const headingId = `${id}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("relative scroll-mt-24 py-20 sm:py-28", className)}
    >
      <div className={cn(!bleed && "mx-auto w-full max-w-6xl px-5 sm:px-8")}>
        <header
          className={cn(
            "mb-10 sm:mb-14",
            bleed && "mx-auto max-w-6xl px-5 sm:px-8",
          )}
        >
          <div className="flex items-baseline gap-3">
            <span
              aria-hidden="true"
              className="text-dim font-mono text-xs tracking-[0.2em]"
            >
              {index}
            </span>
            <span aria-hidden="true" className="bg-line h-px flex-1" />
          </div>

          <h2
            id={headingId}
            className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            {title}
          </h2>

          {kicker && (
            <p className="text-muted text-balance-pretty mt-3 max-w-2xl text-sm leading-relaxed sm:text-[0.9375rem]">
              {kicker}
            </p>
          )}
        </header>

        <div className={contentClassName}>{children}</div>
      </div>
    </section>
  );
}

/** Small uppercase key used for every labelled field on the site. */
export function FieldKey({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn("label-key", className)}>{children}</span>;
}

/** A bordered surface with corner ticks. The standard container. */
export function Panel({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "li" | "aside";
}) {
  return (
    <Tag className={cn("panel corner-ticks relative", className)}>
      {children}
    </Tag>
  );
}
