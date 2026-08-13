import { ArrowDown, ArrowUpRight } from "lucide-react";
import { GithubIcon } from "@/components/ui/brand-icons";
import { siteConfig, githubUrl, isPlaceholder } from "@/config/site";
import { HeroBackground } from "@/components/hero/hero-background";
import { RoleCycle } from "@/components/hero/role-cycle";
import { ActionLink } from "@/components/ui/action";
import { Placeholderable } from "@/components/ui/placeholder";

/**
 * Server component. Only the node field and the role emphasis are client-side,
 * so the headline is in the initial HTML and paints with the document.
 */
export function Hero() {
  const linked = !isPlaceholder(siteConfig.githubUsername);

  const meta: [string, string][] = [
    ["Currently", "MBA — Data Science"],
    ["Focus", "Data engineering / AWS"],
    ["Status", "Open to opportunities"],
  ];

  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative flex min-h-[100svh] items-center overflow-hidden pt-24 pb-20"
    >
      <HeroBackground />

      <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8">
        <p className="text-accent flex items-center gap-2.5 font-mono text-[0.6875rem] tracking-[0.24em] uppercase">
          <span
            aria-hidden="true"
            className="bg-accent animate-pulse-node inline-block h-1.5 w-1.5 rounded-full"
          />
          System online
        </p>

        <h1
          id="hero-heading"
          className="mt-7 max-w-3xl text-[clamp(2.25rem,7vw,4.25rem)] leading-[1.04] font-semibold tracking-[-0.03em]"
        >
          Hello — I&rsquo;m{" "}
          <span className="text-accent">{siteConfig.name}</span>.
        </h1>

        <div className="border-line mt-8 border-l pl-5 sm:pl-6">
          <RoleCycle roles={siteConfig.roles} />
        </div>

        <p className="text-muted text-balance-pretty mt-8 max-w-xl text-[0.9375rem] leading-relaxed sm:text-base">
          {siteConfig.tagline}
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <ActionLink href="#projects" variant="primary">
            Explore my work
            <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
          </ActionLink>

          {linked && (
            <ActionLink href={githubUrl}>
              <GithubIcon aria-hidden="true" className="h-3.5 w-3.5" />
              GitHub
              <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
            </ActionLink>
          )}
        </div>

        {/* Real, verifiable facts only — no invented metrics. */}
        <dl className="border-line mt-16 grid max-w-2xl grid-cols-1 gap-px border-t pt-6 sm:grid-cols-3">
          {meta.map(([key, value]) => (
            <div key={key} className="py-1">
              <dt className="label-key">{key}</dt>
              <dd className="mt-1.5 font-mono text-xs sm:text-[0.8125rem]">
                <Placeholderable value={value} />
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <a
        href="#about"
        aria-label="Scroll to the About section"
        className="text-dim hover:text-accent absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 transition-colors sm:flex"
      >
        <span className="font-mono text-[0.5625rem] tracking-[0.24em] uppercase">
          Scroll
        </span>
        <span
          aria-hidden="true"
          className="from-line-strong h-8 w-px bg-gradient-to-b to-transparent"
        />
      </a>
    </section>
  );
}
