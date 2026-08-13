import type { ReactNode } from "react";
import { Briefcase, GraduationCap } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Chip } from "@/components/ui/action";
import { Placeholderable } from "@/components/ui/placeholder";
import { TimelineRail } from "@/components/experience/timeline-rail";
import { work, education } from "@/data/experience";
import {
  formatPeriodRange,
  formatTotalExperience,
  isPresent,
  roleDuration,
} from "@/lib/duration";
import { cn } from "@/lib/utils";

/**
 * Experience.
 *
 * Work and study are two separate blocks, not one interleaved list — a career
 * history and an academic history answer different questions, and a recruiter
 * scanning for the first should not have to filter out the second.
 *
 * Every date string on screen is derived from the `start` / `end` pair in
 * `src/data/experience.ts`: the range label, the duration, and whether the
 * role is current. Writing `end: "present"` is the only thing that makes a
 * role current, so the two can never disagree.
 */
export function Experience() {
  // One timestamp for the whole section, so every duration is measured from
  // the same instant. Re-evaluated when the page revalidates.
  const now = new Date();

  return (
    <Section
      id="experience"
      index="02"
      title="Experience"
      kicker="Where I've worked and what I studied."
    >
      <div className="space-y-16 sm:space-y-20">
        <Block
          label="Work"
          icon={<Briefcase aria-hidden="true" className="h-3 w-3" />}
          meta={
            work.length > 0 ? formatTotalExperience(work, now) + " total" : null
          }
          tone="accent"
        >
          {work.map((entry, index) => {
            const current = isPresent(entry.end);
            const duration = roleDuration(entry.start, entry.end, now);

            return (
              <Reveal as="li" key={entry.id} delay={0.05 * index}>
                <Entry tone="accent" current={current}>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="text-muted font-mono text-[0.6875rem] tracking-[0.1em]">
                      {formatPeriodRange(entry.start, entry.end, now)}
                    </span>
                    {duration && (
                      <>
                        <span aria-hidden="true" className="bg-line h-px w-4" />
                        <span className="text-dim font-mono text-[0.6875rem] tracking-[0.1em]">
                          {duration}
                        </span>
                      </>
                    )}
                    {current && <Chip tone="accent">Current</Chip>}
                  </div>

                  <h4 className="mt-3 text-lg font-semibold tracking-tight sm:text-xl">
                    {entry.role}
                  </h4>

                  <p className="text-accent mt-1 font-mono text-[0.8125rem]">
                    <Placeholderable value={entry.company} />
                    {entry.location && (
                      <span className="text-dim">
                        {" · "}
                        <Placeholderable value={entry.location} />
                      </span>
                    )}
                  </p>

                  <p className="text-muted text-balance-pretty mt-4 max-w-2xl text-[0.9375rem] leading-relaxed">
                    {entry.summary}
                  </p>

                  {entry.highlights && entry.highlights.length > 0 && (
                    <ul className="mt-4 max-w-2xl space-y-2">
                      {entry.highlights.map((highlight) => (
                        <li
                          key={highlight}
                          className="text-muted flex gap-3 text-sm leading-relaxed"
                        >
                          <span
                            aria-hidden="true"
                            className="bg-accent/50 mt-[0.62em] h-px w-3 shrink-0"
                          />
                          <Placeholderable value={highlight} />
                        </li>
                      ))}
                    </ul>
                  )}

                  <StackList items={entry.stack} />
                </Entry>
              </Reveal>
            );
          })}
        </Block>

        <Block
          label="Education"
          icon={<GraduationCap aria-hidden="true" className="h-3 w-3" />}
          meta={null}
          tone="iris"
        >
          {education.map((entry, index) => {
            const current = isPresent(entry.end);

            return (
              <Reveal as="li" key={entry.id} delay={0.05 * index}>
                <Entry tone="iris" current={current}>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="text-muted font-mono text-[0.6875rem] tracking-[0.1em]">
                      {formatPeriodRange(entry.start, entry.end, now)}
                    </span>
                    {current && <Chip tone="iris">In progress</Chip>}
                  </div>

                  <h4 className="mt-3 text-lg font-semibold tracking-tight sm:text-xl">
                    {entry.qualification}
                  </h4>

                  <p className="text-iris mt-1 font-mono text-[0.8125rem]">
                    <Placeholderable value={entry.institution} />
                    {entry.location && (
                      <span className="text-dim">
                        {" · "}
                        <Placeholderable value={entry.location} />
                      </span>
                    )}
                  </p>

                  {entry.summary && (
                    <p className="text-muted text-balance-pretty mt-4 max-w-2xl text-[0.9375rem] leading-relaxed">
                      {entry.summary}
                    </p>
                  )}

                  <StackList items={entry.stack} />
                </Entry>
              </Reveal>
            );
          })}
        </Block>
      </div>
    </Section>
  );
}

/** A labelled group with its own scroll-linked rail. */
function Block({
  label,
  icon,
  meta,
  tone,
  children,
}: {
  label: string;
  icon: ReactNode;
  meta: string | null;
  tone: "accent" | "iris";
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <span
          className={cn(
            "label-key inline-flex items-center gap-1.5",
            tone === "accent" ? "text-accent" : "text-iris",
          )}
        >
          {icon}
          {label}
        </span>
        <span aria-hidden="true" className="bg-line h-px flex-1" />
        {meta && (
          <span className="text-dim font-mono text-[0.625rem] tracking-[0.14em] uppercase">
            {meta}
          </span>
        )}
      </div>

      <div className="relative pl-8 sm:pl-12">
        <TimelineRail tone={tone} />
        <ol className="space-y-12 sm:space-y-14">{children}</ol>
      </div>
    </div>
  );
}

/** Timeline node + content well. */
function Entry({
  tone,
  current,
  children,
}: {
  tone: "accent" | "iris";
  current: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className={cn(
          "bg-void absolute top-1.5 -left-8 flex h-[15px] w-[15px] -translate-x-1/2 items-center justify-center rounded-full border sm:-left-12 sm:h-[19px] sm:w-[19px]",
          tone === "accent" ? "border-accent" : "border-iris",
          current && "animate-pulse-node",
        )}
      >
        <span
          className={cn(
            "h-[5px] w-[5px] rounded-full",
            tone === "accent" ? "bg-accent" : "bg-iris",
          )}
        />
      </span>
      {children}
    </div>
  );
}

function StackList({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <ul className="mt-5 flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item}>
          <Chip>{item}</Chip>
        </li>
      ))}
    </ul>
  );
}
