import { AlertTriangle, FolderOpen } from "lucide-react";
import { GithubIcon } from "@/components/ui/brand-icons";
import type { GitHubError } from "@/lib/github-shared";
import { githubUrl, siteConfig, isPlaceholder } from "@/config/site";
import { ActionButton, ActionLink } from "@/components/ui/action";
import { isDev } from "@/lib/utils";

/** Loading skeleton streamed while the server fetches repositories. */
export function ProjectsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div aria-hidden="true">
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-line h-7 w-20 border" />
        ))}
      </div>
      <ul className="mt-8 grid gap-px sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <li
            key={i}
            className="border-line bg-raised/40 relative h-[15rem] overflow-hidden border p-5"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.03] to-transparent motion-safe:animate-[sweep_2.2s_cubic-bezier(0.16,1,0.3,1)_infinite]" />
            <div className="bg-line h-3.5 w-2/5" />
            <div className="bg-line/70 mt-4 h-2.5 w-full" />
            <div className="bg-line/70 mt-2 h-2.5 w-11/12" />
            <div className="bg-line/70 mt-2 h-2.5 w-3/5" />
            <div className="mt-6 flex gap-1.5">
              <div className="bg-line h-4 w-14" />
              <div className="bg-line h-4 w-12" />
            </div>
            <div className="border-line absolute inset-x-5 bottom-10 border-t pt-4">
              <div className="bg-line h-2.5 w-24" />
            </div>
          </li>
        ))}
      </ul>
      <p className="sr-only" role="status">
        Loading repositories from GitHub…
      </p>
    </div>
  );
}

/**
 * Failure state. Shows a plain-language explanation and a retry, never a raw
 * API error. Setup hints (wrong username, missing token) render in development
 * only — a visitor should not be reading your configuration notes.
 */
export function ProjectsError({
  error,
  onRetry,
  retrying,
}: {
  error: GitHubError;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  const notConfigured = error.kind === "not-configured";

  return (
    <div
      role="alert"
      className="border-line bg-raised/40 corner-ticks relative flex flex-col items-start gap-5 border p-8 sm:p-10"
    >
      <span className="border-warn/40 text-warn flex h-10 w-10 items-center justify-center border">
        <AlertTriangle aria-hidden="true" className="h-4 w-4" />
      </span>

      <div>
        <p className="text-warn font-mono text-[0.6875rem] tracking-[0.22em] uppercase">
          {notConfigured
            ? "GitHub not linked"
            : "GitHub connection interrupted"}
        </p>
        <p className="text-fg mt-3 max-w-md text-[0.9375rem] leading-relaxed">
          {error.message}
        </p>
        {isDev && error.hint && (
          <p className="text-dim border-line mt-4 max-w-md border-l pl-3 font-mono text-xs leading-relaxed">
            dev note — {error.hint}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {onRetry && !notConfigured && (
          <ActionButton onClick={onRetry} disabled={retrying} variant="primary">
            {retrying ? "Retrying…" : "Retry"}
          </ActionButton>
        )}
        {!isPlaceholder(siteConfig.githubUsername) && (
          <ActionLink href={githubUrl}>
            <GithubIcon aria-hidden="true" className="h-3.5 w-3.5" />
            View on GitHub
          </ActionLink>
        )}
      </div>
    </div>
  );
}

/** No repositories came back, and that is a real answer rather than an error. */
export function ProjectsEmpty() {
  return (
    <div className="border-line bg-raised/40 corner-ticks relative flex flex-col items-start gap-5 border p-8 sm:p-10">
      <span className="border-line text-dim flex h-10 w-10 items-center justify-center border">
        <FolderOpen aria-hidden="true" className="h-4 w-4" />
      </span>
      <div>
        <p className="label-key">No public repositories</p>
        <p className="text-muted mt-3 max-w-md text-[0.9375rem] leading-relaxed">
          This account has no public repositories to show yet. Anything pushed
          publicly will appear here automatically.
        </p>
      </div>
      {!isPlaceholder(siteConfig.githubUsername) && (
        <ActionLink href={githubUrl}>
          <GithubIcon aria-hidden="true" className="h-3.5 w-3.5" />
          Visit the profile
        </ActionLink>
      )}
    </div>
  );
}
