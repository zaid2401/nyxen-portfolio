import Link from "next/link";
import { ArrowDown, ArrowUpRight, Zap } from "lucide-react";
import { GithubIcon } from "@/components/ui/brand-icons";
import { siteConfig, githubUrl, isPlaceholder } from "@/config/site";
import { HeroBackground } from "@/components/hero/hero-background";
import { RoleCycle } from "@/components/hero/role-cycle";
import { Telemetry } from "@/components/hero/telemetry";
import { ActionLink } from "@/components/ui/action";
import { identityRows, work } from "@/data/experience";
import { formatTotalExperience } from "@/lib/duration";

/**
 * SYSTEM CORE — the homepage.
 *
 * Server component. Only the node field, the role emphasis and the telemetry
 * bars are client-side, so the headline is in the initial HTML and paints with
 * the document.
 *
 * The name is the largest thing on the screen and the discipline line is
 * directly under it, because the first question a recruiter asks is "who is
 * this and what do they do" — the OS framing is the second thing they read,
 * never the obstacle in front of the first.
 */
export function Hero() {
  const linked = !isPlaceholder(siteConfig.githubUsername);
  const fullName =
    identityRows.find((row) => row.key === "NAME")?.value ?? siteConfig.name;
  const experience = formatTotalExperience(work);

  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative flex min-h-[100svh] items-center overflow-hidden pt-24 pb-20"
    >
      <HeroBackground />

      <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8">
        {/* System identification strip. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.625rem] tracking-[0.24em] uppercase">
          <p className="text-fg">{siteConfig.brand}</p>
          <span aria-hidden="true" className="bg-line h-px w-6" />
          <p className="text-accent flex items-center gap-2">
            <span
              aria-hidden="true"
              className="bg-accent animate-pulse-node inline-block h-1.5 w-1.5 rounded-full"
            />
            System online
          </p>
        </div>

        <h1
          id="hero-heading"
          className="mt-7 max-w-3xl text-[clamp(2.5rem,8vw,4.75rem)] leading-[1.02] font-semibold tracking-[-0.035em]"
        >
          {fullName}
        </h1>

        <p className="text-accent mt-4 font-mono text-sm tracking-[0.12em] sm:text-[0.9375rem]">
          Software · Automation · Data
        </p>

        <div className="border-line mt-8 border-l pl-5 sm:pl-6">
          <RoleCycle roles={siteConfig.roles} />
        </div>

        <p className="text-muted text-balance-pretty mt-8 max-w-xl text-[0.9375rem] leading-relaxed sm:text-base">
          {siteConfig.tagline}
        </p>

        {/* Three doors: explore, hire, or look at the work. */}
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <ActionLink href="#about" variant="primary">
            Enter system
            <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
          </ActionLink>

          <Link
            href="/recruiter"
            className="group border-line-strong text-fg hover:border-accent-line hover:text-accent relative inline-flex items-center justify-center gap-2.5 overflow-hidden border px-5 py-3 font-mono text-[0.6875rem] tracking-[0.16em] uppercase transition-colors duration-300 outline-none"
          >
            <Zap aria-hidden="true" className="h-3.5 w-3.5" />
            Recruiter mode
          </Link>

          <ActionLink href="#case-files" variant="quiet">
            View case files
            <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          </ActionLink>
        </div>

        <Telemetry />

        {/* Real, verifiable facts only — no invented metrics. */}
        <dl className="border-line mt-10 grid max-w-2xl grid-cols-1 gap-px border-t pt-6 sm:grid-cols-3">
          {(
            [
              ["Experience", experience],
              ["Focus", "Software / Automation developer"],
              ["Learning", "Data engineering"],
              ["Status", "Open to opportunities"],
            ] as [string, string][]
          ).map(([key, value]) => (
            <div key={key} className="py-1">
              <dt className="label-key">{key}</dt>
              <dd className="mt-1.5 font-mono text-xs sm:text-[0.8125rem]">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        {linked && (
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-dim hover:text-accent mt-6 inline-flex items-center gap-2 font-mono text-[0.6875rem] transition-colors"
          >
            <GithubIcon aria-hidden="true" className="h-3.5 w-3.5" />
            github.com/{siteConfig.githubUsername}
            <ArrowUpRight aria-hidden="true" className="h-3 w-3" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        )}
      </div>
    </section>
  );
}
