import { GithubIcon, LinkedinIcon } from "@/components/ui/brand-icons";
import { Wordmark } from "@/components/ui/emblem";
import { siteConfig, githubUrl, isPlaceholder } from "@/config/site";

export function Footer() {
  const year = new Date().getUTCFullYear();

  return (
    <footer className="border-line relative border-t">
      <div
        aria-hidden="true"
        className="grid-field pointer-events-none absolute inset-0 opacity-30"
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-12 sm:px-8 sm:py-14 md:flex-row md:items-end md:justify-between">
        <div>
          <Wordmark />
          <p className="text-muted mt-4 max-w-xs text-sm leading-relaxed">
            Built with curiosity &amp; code.
          </p>
          <p className="text-dim mt-6 font-mono text-[0.625rem] tracking-[0.16em] uppercase">
            © {year} {siteConfig.name}
          </p>
        </div>

        <div className="flex flex-col gap-5 md:items-end">
          <ul className="flex items-center gap-1">
            {!isPlaceholder(siteConfig.githubUsername) && (
              <li>
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-accent hover:border-line-strong block border border-transparent p-2.5 transition-colors"
                  aria-label="GitHub profile (opens in a new tab)"
                >
                  <GithubIcon aria-hidden="true" className="h-4 w-4" />
                </a>
              </li>
            )}
            {!isPlaceholder(siteConfig.linkedin) && (
              <li>
                <a
                  href={siteConfig.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-accent hover:border-line-strong block border border-transparent p-2.5 transition-colors"
                  aria-label="LinkedIn profile (opens in a new tab)"
                >
                  <LinkedinIcon aria-hidden="true" className="h-4 w-4" />
                </a>
              </li>
            )}
          </ul>

          <p className="text-dim font-mono text-[0.625rem] leading-relaxed tracking-[0.1em] md:text-right">
            Next.js · TypeScript · Tailwind · Framer Motion
            <br />
            <span className="text-dim/70">
              Projects fetched live from the GitHub API
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
