import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Mail, FileText, Zap } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/brand-icons";
import { siteConfig, githubUrl, isPlaceholder } from "@/config/site";
import {
  work,
  education,
  identityRows,
  aboutParagraphs,
} from "@/data/experience";
import { caseFiles } from "@/data/case-files";
import { skills, skillCategories } from "@/data/skills";
import {
  formatPeriodRange,
  formatTotalExperience,
  roleDuration,
} from "@/lib/duration";
import { ActionLink } from "@/components/ui/action";
import { Emblem } from "@/components/ui/emblem";
import { CopyEmail } from "@/components/contact/copy-email";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * RECRUITER MODE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * A dedicated route rather than a toggle on the homepage, for three reasons: it
 * is linkable and bookmarkable, it is statically rendered with no client
 * JavaScript for the content, and it genuinely removes the interface rather
 * than hiding it — there is no canvas, no cursor effect, no simulator and no
 * boot sequence competing with the information.
 *
 * The target is that someone can answer "should we interview this person" in
 * under a minute. Everything is above the fold or one scroll away, ordered by
 * what a hiring decision actually turns on: what they do, what it produced,
 * where they did it, and how to reach them.
 *
 * Every figure here is sourced from `src/data/` — the same values the main site
 * renders. Nothing is restated more favourably for this audience.
 */

export const metadata: Metadata = {
  title: "For recruiters",
  description: `${siteConfig.name} — ${siteConfig.role}. Experience, measured results, technologies and contact details on one page.`,
  alternates: { canonical: "/recruiter" },
  // This page duplicates content from the homepage for a specific audience;
  // it should not compete with it in search results.
  robots: { index: false, follow: true },
};

const CORE_AREAS = [
  "RPA / Automation",
  "Python",
  "Software development",
  "Data",
  "SQL",
  "AI integration",
];

export default function RecruiterPage() {
  const experience = formatTotalExperience(work);
  const hasEmail = !isPlaceholder(siteConfig.email);
  const hasLinkedIn = !isPlaceholder(siteConfig.linkedin);
  const hasGitHub = !isPlaceholder(siteConfig.githubUsername);
  const fullName =
    identityRows.find((row) => row.key === "NAME")?.value ?? siteConfig.name;
  const location = identityRows.find((row) => row.key === "LOCATION")?.value;

  // Only cases with a documented figure. Never padded to fill the row.
  const measured = caseFiles.flatMap((item) =>
    item.result.metrics.map((metric) => ({
      ...metric,
      project: item.name,
      index: item.index,
    })),
  );

  return (
    <div className="relative min-h-screen">
      <div
        aria-hidden="true"
        className="grid-field pointer-events-none fixed inset-0 opacity-30"
      />

      <div className="relative mx-auto w-full max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        {/* ── Bar ──────────────────────────────────────────────────────────── */}
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="text-dim hover:text-fg flex items-center gap-2 font-mono text-[0.625rem] tracking-[0.16em] uppercase transition-colors"
          >
            <ArrowLeft aria-hidden="true" className="h-3 w-3" />
            Full site
          </Link>
          <p className="text-accent flex items-center gap-2 font-mono text-[0.625rem] tracking-[0.18em] uppercase">
            <Zap aria-hidden="true" className="h-3 w-3" />
            Recruiter mode
          </p>
        </div>

        {/* ── Identity ─────────────────────────────────────────────────────── */}
        <header className="border-line border-b pb-10">
          <div className="flex items-start gap-4">
            <span className="text-accent mt-1 h-9 w-9 shrink-0">
              <Emblem live />
            </span>
            <div className="min-w-0">
              <h1 className="text-[clamp(2rem,6vw,3.25rem)] leading-[1.05] font-semibold tracking-[-0.03em]">
                {fullName}
              </h1>
              <p className="text-accent mt-2.5 font-mono text-sm sm:text-base">
                {siteConfig.role}
              </p>
            </div>
          </div>

          <dl className="border-line mt-8 grid grid-cols-2 gap-px border-t pt-6 sm:grid-cols-4">
            <Fact label="Experience" value={experience} />
            <Fact label="Location" value={location ?? "Not specified"} />
            <Fact label="Education" value="BSc Computer Science" />
            <Fact label="Status" value="Open to opportunities" />
          </dl>
        </header>

        {/* ── Core areas ───────────────────────────────────────────────────── */}
        <Block title="Core areas">
          <ul className="flex flex-wrap gap-1.5">
            {CORE_AREAS.map((area) => (
              <li
                key={area}
                className="border-accent-line/40 text-accent bg-accent/[0.05] border px-3 py-1.5 font-mono text-[0.6875rem] tracking-[0.08em]"
              >
                {area}
              </li>
            ))}
          </ul>
        </Block>

        {/* ── Measured impact ──────────────────────────────────────────────── */}
        <Block
          title="Measured impact"
          note="Only figures that were actually recorded appear here. Work without a measured number is described in the case files instead of being given one."
        >
          {measured.length > 0 ? (
            <dl className="grid gap-px sm:grid-cols-2">
              {measured.map((metric) => (
                <div
                  key={`${metric.project}-${metric.label}`}
                  className="border-accent-line/40 bg-accent/[0.04] border p-5"
                >
                  <dt className="label-key">{metric.label}</dt>
                  <dd className="mt-3">
                    <p className="flex flex-wrap items-baseline gap-2.5 font-mono">
                      <span className="text-dim text-sm line-through decoration-1">
                        {metric.before}
                      </span>
                      <span className="text-dim">→</span>
                      <span className="text-accent text-xl">
                        {metric.after}
                      </span>
                    </p>
                    {metric.delta && (
                      <p className="text-fg mt-2 font-mono text-sm">
                        {metric.delta}
                      </p>
                    )}
                    <p className="text-dim mt-2.5 font-mono text-[0.625rem] tracking-[0.1em] uppercase">
                      Case file #{metric.index} · {metric.project}
                    </p>
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-dim text-sm">
              No measured figures recorded yet.
            </p>
          )}
        </Block>

        {/* ── Experience ───────────────────────────────────────────────────── */}
        <Block title="Experience">
          <ol className="space-y-8">
            {work.map((entry) => (
              <li key={entry.id}>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-lg font-semibold tracking-tight">
                    {entry.role}
                  </h3>
                  <span className="text-dim font-mono text-[0.6875rem]">
                    {roleDuration(entry.start, entry.end)}
                  </span>
                </div>
                <p className="text-accent mt-1 font-mono text-[0.8125rem]">
                  {entry.company}
                  {entry.location && (
                    <span className="text-dim"> · {entry.location}</span>
                  )}
                  <span className="text-dim">
                    {" · "}
                    {formatPeriodRange(entry.start, entry.end)}
                  </span>
                </p>
                {entry.highlights && (
                  <ul className="mt-4 space-y-2">
                    {entry.highlights.map((highlight) => (
                      <li
                        key={highlight}
                        className="text-muted flex gap-3 text-[0.875rem] leading-relaxed"
                      >
                        <span
                          aria-hidden="true"
                          className="bg-accent/50 mt-[0.62em] h-px w-3 shrink-0"
                        />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </Block>

        {/* ── Projects ─────────────────────────────────────────────────────── */}
        <Block title="Projects">
          <ul className="space-y-px">
            {caseFiles.map((item) => (
              <li
                key={item.id}
                className="border-line bg-raised/40 border p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-accent font-mono text-[0.625rem] tracking-[0.14em]">
                    #{item.index}
                  </span>
                  <h3 className="font-semibold tracking-tight">{item.name}</h3>
                </div>
                <p className="text-muted mt-2 text-[0.875rem] leading-relaxed">
                  {item.summary}
                </p>
                <p className="text-dim mt-2.5 font-mono text-[0.625rem]">
                  {item.stack.join(" · ")}
                </p>
              </li>
            ))}
          </ul>
          <p className="text-dim mt-4 text-[0.8125rem] leading-relaxed">
            Full write-ups — problem, architecture and result for each —{" "}
            <Link
              href="/#case-files"
              className="text-accent link-underline hover:text-accent"
            >
              are on the main site
            </Link>
            .
          </p>
        </Block>

        {/* ── Technologies ─────────────────────────────────────────────────── */}
        <Block title="Technologies">
          <dl className="space-y-3">
            {Object.entries(skillCategories).map(([key, category]) => {
              const items = skills.filter((skill) => skill.category === key);
              if (items.length === 0) return null;
              return (
                <div key={key} className="flex flex-wrap gap-x-3 gap-y-1.5">
                  <dt className="label-key w-24 shrink-0 pt-1">
                    {category.label}
                  </dt>
                  <dd className="text-muted min-w-0 flex-1 font-mono text-[0.8125rem]">
                    {items.map((skill) => skill.label).join("  ·  ")}
                  </dd>
                </div>
              );
            })}
          </dl>
        </Block>

        {/* ── Education ────────────────────────────────────────────────────── */}
        <Block title="Education">
          <ul className="space-y-4">
            {education.map((entry) => (
              <li key={entry.id}>
                <p className="font-semibold tracking-tight">
                  {entry.qualification}
                </p>
                <p className="text-muted mt-1 font-mono text-[0.8125rem]">
                  {entry.institution}
                  <span className="text-dim">
                    {" · "}
                    {formatPeriodRange(entry.start, entry.end)}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </Block>

        {/* ── Summary ──────────────────────────────────────────────────────── */}
        <Block title="In their own words">
          <p className="text-muted text-[0.9375rem] leading-relaxed">
            {aboutParagraphs[0]}
          </p>
        </Block>

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <div className="border-line mt-12 border-t pt-10">
          <h2 className="text-xl font-semibold tracking-tight">Get in touch</h2>

          <div className="mt-6 flex flex-wrap gap-2">
            {hasEmail && (
              <ActionLink
                href={`mailto:${siteConfig.email}?subject=${encodeURIComponent("Opportunity — " + fullName)}`}
                variant="primary"
                external={false}
              >
                <Mail aria-hidden="true" className="h-3.5 w-3.5" />
                Email
              </ActionLink>
            )}
            {hasLinkedIn && (
              <ActionLink href={siteConfig.linkedin}>
                <LinkedinIcon aria-hidden="true" className="h-3.5 w-3.5" />
                LinkedIn
                <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
              </ActionLink>
            )}
            {hasGitHub && (
              <ActionLink href={githubUrl}>
                <GithubIcon aria-hidden="true" className="h-3.5 w-3.5" />
                GitHub
                <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
              </ActionLink>
            )}
            <ResumeAction />
          </div>

          {hasEmail && (
            <div className="border-line mt-6 flex flex-wrap items-center gap-2.5 border-t pt-6">
              <span className="label-key">Email</span>
              <a
                href={`mailto:${siteConfig.email}`}
                className="text-fg hover:text-accent font-mono text-sm transition-colors"
              >
                {siteConfig.email}
              </a>
              <CopyEmail email={siteConfig.email} />
            </div>
          )}
        </div>

        <p className="text-dim mt-12 font-mono text-[0.625rem] leading-relaxed tracking-[0.1em] uppercase">
          Every figure on this page is sourced from the same data as the main
          site.{" "}
          <Link href="/" className="text-muted hover:text-accent">
            Return to {siteConfig.brand}
          </Link>
        </p>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-1">
      <dt className="label-key">{label}</dt>
      <dd className="mt-1.5 font-mono text-xs sm:text-[0.8125rem]">{value}</dd>
    </div>
  );
}

function Block({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <div className="mb-5 flex items-center gap-3">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <span aria-hidden="true" className="bg-line h-px flex-1" />
      </div>
      {note && (
        <p className="text-dim mb-5 max-w-2xl text-[0.8125rem] leading-relaxed">
          {note}
        </p>
      )}
      {children}
    </section>
  );
}

/**
 * Résumé download. If no file is configured, this states that plainly instead
 * of linking to a 404 — and points the author at the exact place to fix it.
 */
function ResumeAction() {
  if (siteConfig.resumeUrl) {
    return (
      <ActionLink href={siteConfig.resumeUrl}>
        <FileText aria-hidden="true" className="h-3.5 w-3.5" />
        Download CV
      </ActionLink>
    );
  }

  return (
    <span className="border-line text-dim inline-flex items-center gap-2.5 border border-dashed px-5 py-3 font-mono text-[0.6875rem] tracking-[0.16em] uppercase">
      <FileText aria-hidden="true" className="h-3.5 w-3.5" />
      CV on request
    </span>
  );
}
