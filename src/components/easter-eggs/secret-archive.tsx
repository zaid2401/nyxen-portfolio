"use client";

import { Terminal as TerminalIcon } from "lucide-react";
import { useSystem } from "@/components/system/system-provider";
import { Dialog } from "@/components/ui/dialog";
import { ActionButton } from "@/components/ui/action";
import { siteConfig } from "@/config/site";
import { work, education } from "@/data/experience";
import { personal } from "@/data/personal";
import { formatPeriodRange } from "@/lib/duration";
import { isDev } from "@/lib/utils";

/**
 * The hidden archive — `sudo nyxen --secret` in the shell.
 *
 * A note on what is in here. The obvious content for a secret page is a
 * personal origin story, and I have deliberately not written one: nothing on
 * this site is invented, and that rule does not get suspended because the page
 * is hidden. So the archive contains things that are actually true — the
 * decisions behind this build, and the timeline already in the data files —
 * plus one slot only the author can fill, marked as such rather than
 * ghost-written.
 *
 * It is an easter egg, so it rewards curiosity. It is not load-bearing: nothing
 * here is needed to understand the portfolio.
 */

const BUILD_NOTES: { title: string; body: string }[] = [
  {
    title: "No hand-written project list",
    body: "The GitHub section is whatever the API returns. The alternative — an array of projects in the source — is the reason most portfolios are eighteen months out of date, and it was the first thing designed out.",
  },
  {
    title: "No proficiency percentages",
    body: "Skill DNA has no bars saying 'Python 92%'. A self-assigned percentage is unfalsifiable. Each node links to the repositories and case files that actually use the technology instead, which anyone can go and check.",
  },
  {
    title: "One motion flag",
    body: "Every animation on the site reads a single value that combines the effects switch with the OS reduced-motion setting. One flag means no component can accidentally ignore the accessibility preference — the failure mode is impossible rather than merely discouraged.",
  },
  {
    title: "The data layer never throws",
    body: "Every GitHub call returns a result object, not an exception. The UI therefore always has a concrete state to render: data, or a specific readable failure. There is no path where the section is simply blank and nobody knows why.",
  },
  {
    title: "The Lab had to actually run",
    body: "It started as three animated logs that printed a scripted story and called it a demo. That is a screensaver with a Run button. It was rewritten as three tools that do the work for real — a CSV parser and validation pipeline, a document field extractor, and a quotation generator — on whatever data you paste in. If a panel cannot compute its output from your input, it does not belong in there.",
  },
];

export function SecretArchive() {
  const { archiveOpen, setArchiveOpen } = useSystem();

  return (
    <Dialog
      open={archiveOpen}
      onClose={() => setArchiveOpen(false)}
      labelId="archive-title"
      title={
        <>
          <p className="text-accent font-mono text-[0.625rem] tracking-[0.2em] uppercase">
            Access granted
          </p>
          <h3 className="mt-1.5 font-mono text-lg tracking-[0.08em]">
            Hidden archive
          </h3>
        </>
      }
    >
      <div className="scanlines">
        <p className="text-muted text-[0.9375rem] leading-relaxed">
          You found it. Since you went looking, here is the part that usually
          only shows up in a code review.
        </p>

        {/* ── Build decisions ───────────────────────────────────────────── */}
        <section className="mt-8">
          <div className="mb-4 flex items-center gap-3">
            <h4 className="label-key">Why this site is built the way it is</h4>
            <span aria-hidden="true" className="bg-line h-px flex-1" />
          </div>

          <ol className="space-y-px">
            {BUILD_NOTES.map((note, index) => (
              <li
                key={note.title}
                className="border-line bg-void/40 flex gap-4 border p-4"
              >
                <span className="text-accent/60 shrink-0 font-mono text-[0.625rem] tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-[0.8125rem]">{note.title}</p>
                  <p className="text-dim mt-1.5 text-[0.8125rem] leading-relaxed">
                    {note.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Timeline ──────────────────────────────────────────────────── */}
        <section className="mt-8">
          <div className="mb-4 flex items-center gap-3">
            <h4 className="label-key">The short version of the route here</h4>
            <span aria-hidden="true" className="bg-line h-px flex-1" />
          </div>
          <ul className="space-y-2.5">
            {[...education]
              .slice()
              .reverse()
              .map((entry) => (
                <li
                  key={entry.id}
                  className="text-muted flex gap-3 font-mono text-[0.75rem]"
                >
                  <span className="text-dim w-28 shrink-0">
                    {formatPeriodRange(entry.start, entry.end)}
                  </span>
                  <span className="min-w-0">{entry.qualification}</span>
                </li>
              ))}
            {work.map((entry) => (
              <li
                key={entry.id}
                className="text-muted flex gap-3 font-mono text-[0.75rem]"
              >
                <span className="text-dim w-28 shrink-0">
                  {formatPeriodRange(entry.start, entry.end)}
                </span>
                <span className="min-w-0">
                  {entry.role} — {entry.company}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Author slot ───────────────────────────────────────────────── */}
        <section className="mt-8">
          <div className="mb-4 flex items-center gap-3">
            <h4 className="label-key">Why &ldquo;{siteConfig.brand}&rdquo;?</h4>
            <span aria-hidden="true" className="bg-line h-px flex-1" />
          </div>
          {personal.whyNyxen ? (
            <p className="text-muted text-[0.8125rem] leading-relaxed">
              {personal.whyNyxen}
            </p>
          ) : (
            <p className="border-warn/30 text-dim border border-dashed p-4 text-[0.8125rem] leading-relaxed">
              Only one person can answer this one, and it isn&rsquo;t the
              machine that built the page. Rather than invent an origin story to
              fill the space, this panel is left for {siteConfig.name} to write
              — the same rule that governs every other claim on this site.
              {/* A note to the author, not to the reader. Visitors get the
                  explanation above; the file path would just look like an
                  unfinished TODO on a published site. */}
              {isDev && (
                <span className="text-dim/70 mt-2.5 block font-mono text-[0.625rem]">
                  Author: set `whyNyxen` in src/data/personal.ts
                </span>
              )}
            </p>
          )}
        </section>

        <div className="border-line mt-8 flex flex-wrap gap-2 border-t pt-6">
          <ActionButton variant="primary" onClick={() => setArchiveOpen(false)}>
            <TerminalIcon aria-hidden="true" className="h-3.5 w-3.5" />
            Back to the shell
          </ActionButton>
        </div>
      </div>
    </Dialog>
  );
}
