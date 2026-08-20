"use client";

import { useEffect, useRef, useState } from "react";
import { useSystem } from "@/components/system/system-provider";
import { caseFiles } from "@/data/case-files";
import { skills } from "@/data/skills";
import { work } from "@/data/experience";
import { totalExperienceMonths } from "@/lib/duration";
import { cn } from "@/lib/utils";

/**
 * System telemetry.
 *
 * A deliberate departure from the genre: these are NOT fake CPU and memory
 * meters. A portfolio has no CPU load worth reporting, and a bar that animates
 * to a number nobody measured is decoration pretending to be data — the exact
 * thing this site is arguing against everywhere else.
 *
 * So the bars read real values, counted from the data files at build time. Each
 * one shows its actual figure beside it and states the scale it is drawn
 * against, because a bar with no denominator is just a shape. The only
 * invented quantity is the ceiling each bar is measured against, and that is
 * printed on screen.
 */

interface Channel {
  label: string;
  value: number;
  /** Denominator the bar is drawn against. Shown to the reader. */
  ceiling: number;
  display: string;
}

const CELLS = 12;

/** Skill ids that sit in the automation category, resolved once. */
const AUTOMATION_SKILLS = new Set(
  skills.filter((skill) => skill.category === "automation").map((s) => s.id),
);

function channels(): Channel[] {
  const months = totalExperienceMonths(work);
  // Counted from the skill graph rather than by pattern-matching stack strings:
  // a case file is automation work because it uses an automation technology,
  // and that relationship is already declared in the data.
  const automationCases = caseFiles.filter((c) =>
    c.skills.some((id) => AUTOMATION_SKILLS.has(id)),
  ).length;

  return [
    {
      label: "Experience",
      value: months,
      ceiling: 36,
      display: `${months} mo`,
    },
    {
      label: "Case files",
      value: caseFiles.length,
      ceiling: 6,
      display: String(caseFiles.length),
    },
    {
      label: "Automation",
      value: automationCases,
      ceiling: 6,
      display: `${automationCases} systems`,
    },
    {
      label: "Technologies",
      value: skills.length,
      ceiling: 14,
      display: String(skills.length),
    },
  ];
}

export function Telemetry() {
  const { motionEnabled } = useSystem();
  // `filled` only drives the reveal animation. With motion off it is never
  // read — the bars render complete — so there is no state to synchronise.
  const [filled, setFilled] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const data = channels();

  // Fill once, when the bars are actually on screen. No loop, no timer left
  // running — a readout that animates forever reads as noise, not data.
  useEffect(() => {
    if (!motionEnabled) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        const start = performance.now();
        const DURATION = 900;
        let frame = 0;
        const step = (now: number) => {
          const t = Math.min((now - start) / DURATION, 1);
          // Ease-out so it settles rather than slamming into place.
          setFilled(1 - Math.pow(1 - t, 3));
          if (t < 1) frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frame);
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [motionEnabled]);

  return (
    <div ref={ref} className="border-line mt-12 max-w-md border-t pt-5">
      <p className="label-key mb-3.5">System telemetry</p>

      <dl className="space-y-2">
        {data.map((channel) => {
          const ratio = Math.min(channel.value / channel.ceiling, 1);
          const cells = Math.round(
            ratio * CELLS * (motionEnabled ? filled : 1),
          );

          return (
            <div
              key={channel.label}
              className="flex items-center gap-3 font-mono text-[0.625rem]"
            >
              <dt className="text-dim w-24 shrink-0 tracking-[0.1em] uppercase">
                {channel.label}
              </dt>
              <dd className="flex min-w-0 flex-1 items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="text-accent tracking-[0.1em]"
                >
                  {"█".repeat(cells)}
                  <span className="text-line-strong">
                    {"░".repeat(CELLS - cells)}
                  </span>
                </span>
                <span className="text-muted shrink-0 tabular-nums">
                  {channel.display}
                </span>
              </dd>
            </div>
          );
        })}
      </dl>

      <p
        className={cn(
          "text-dim/80 mt-3.5 font-mono text-[0.5625rem] leading-relaxed tracking-[0.08em]",
        )}
      >
        Real counts from this site&rsquo;s own data. Bars are drawn against a
        fixed scale (36 months / 6 / 6 / 14) — the figures beside them are the
        actual values.
      </p>
    </div>
  );
}
