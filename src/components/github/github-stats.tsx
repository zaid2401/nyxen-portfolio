import { ArrowUpRight } from "lucide-react";
import { GithubIcon } from "@/components/ui/brand-icons";
import type { Profile, Repo } from "@/lib/github-shared";
import { githubUrl, siteConfig } from "@/config/site";
import { languageColor } from "@/lib/languages";
import { formatDate } from "@/lib/utils";

/**
 * Profile read-out.
 *
 * Every number here comes from the API response. Where GitHub did not provide
 * something, the field says so rather than showing a zero that reads like a
 * measurement. The language breakdown is computed from the repositories that
 * actually reported a primary language — repositories without one are excluded
 * from the denominator instead of being silently bucketed as "other".
 */
export function GithubStats({
  profile,
  repos,
  failed,
}: {
  profile: Profile | null;
  repos: Repo[];
  failed: boolean;
}) {
  // Language distribution across the visible repositories.
  const counts = new Map<string, number>();
  for (const repo of repos) {
    if (!repo.language) continue;
    counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
  }
  const typed = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const totalTyped = typed.reduce((sum, [, count]) => sum + count, 0);

  const lastPush = repos
    .map((repo) => repo.pushedAt ?? repo.updatedAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  const stars = repos.reduce((sum, repo) => sum + repo.stars, 0);

  return (
    <div className="border-line bg-raised/40 corner-ticks relative border">
      <div className="border-line flex items-center justify-between gap-3 border-b px-4 py-2.5">
        <p className="label-key">GitHub account</p>
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-dim hover:text-accent flex items-center gap-1.5 font-mono text-[0.5625rem] tracking-[0.14em] uppercase transition-colors"
        >
          <GithubIcon aria-hidden="true" className="h-2.5 w-2.5" />@
          {siteConfig.githubUsername}
          <ArrowUpRight aria-hidden="true" className="h-2.5 w-2.5" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>

      {failed && !profile ? (
        <p className="text-dim p-5 text-[0.8125rem] leading-relaxed">
          Profile details are unavailable right now. The repository list below
          is unaffected if it loaded.
        </p>
      ) : (
        <>
          <dl className="divide-line grid grid-cols-2 divide-x sm:grid-cols-4">
            <Stat
              label="Repositories"
              value={
                profile ? String(profile.publicRepos) : String(repos.length)
              }
            />
            <Stat
              label="Listed here"
              value={String(repos.length)}
              note="after filters"
            />
            <Stat label="Total stars" value={String(stars)} />
            <Stat
              label="Followers"
              value={profile ? String(profile.followers) : "—"}
            />
          </dl>

          <div className="border-line border-t p-4">
            <p className="label-key">Language distribution</p>
            {typed.length > 0 ? (
              <>
                <div
                  aria-hidden="true"
                  className="mt-3 flex h-1.5 w-full overflow-hidden"
                >
                  {typed.map(([language, count]) => (
                    <span
                      key={language}
                      style={{
                        width: `${(count / totalTyped) * 100}%`,
                        backgroundColor: languageColor(language),
                      }}
                    />
                  ))}
                </div>
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                  {typed.slice(0, 6).map(([language, count]) => (
                    <li
                      key={language}
                      className="text-muted flex items-center gap-1.5 font-mono text-[0.625rem]"
                    >
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: languageColor(language) }}
                      />
                      {language}
                      <span className="text-dim tabular-nums">{count}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-dim mt-2 font-mono text-xs italic">
                No repository reports a primary language yet.
              </p>
            )}
          </div>

          <div className="border-line grid grid-cols-2 gap-4 border-t p-4">
            <div>
              <p className="label-key">Latest push</p>
              <p className="text-muted mt-1.5 font-mono text-[0.6875rem]">
                {lastPush ? formatDate(lastPush) : "Not available"}
              </p>
            </div>
            <div>
              <p className="label-key">Account created</p>
              <p className="text-muted mt-1.5 font-mono text-[0.6875rem]">
                {profile ? formatDate(profile.createdAt) : "Not available"}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="p-4">
      <dt className="label-key">{label}</dt>
      <dd className="mt-1.5 font-mono text-lg tabular-nums">{value}</dd>
      {note && (
        <p className="text-dim mt-0.5 font-mono text-[0.5625rem] tracking-[0.1em] uppercase">
          {note}
        </p>
      )}
    </div>
  );
}
