"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Globe, Scale, Star, GitFork } from "lucide-react";
import { GithubIcon } from "@/components/ui/brand-icons";
import type { GitHubError, GitHubResult, Repo } from "@/lib/github-shared";
import { availableCategories } from "@/lib/github-shared";
import { ProjectCard } from "@/components/projects/project-card";
import {
  ProjectsEmpty,
  ProjectsError,
} from "@/components/projects/project-states";
import { Dialog } from "@/components/ui/dialog";
import { ActionLink, Chip } from "@/components/ui/action";
import { useSystem } from "@/components/system/system-provider";
import { languageColor } from "@/lib/languages";
import { cn, formatDate } from "@/lib/utils";

/**
 * Everything interactive about Projects lives here; the fetch itself happened
 * on the server. `initial` is the server result, so the grid is in the HTML on
 * first paint and the client only takes over for filtering, the detail dialog,
 * and the retry path.
 */
export function ProjectsClient({ initial }: { initial: GitHubResult<Repo[]> }) {
  const [repos, setRepos] = useState<Repo[] | null>(
    initial.ok ? initial.data : null,
  );
  const [error, setError] = useState<GitHubError | null>(
    initial.ok ? null : initial.error,
  );
  const [retrying, setRetrying] = useState(false);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Repo | null>(null);
  const { motionEnabled } = useSystem();

  const retry = useCallback(async () => {
    setRetrying(true);
    try {
      const response = await fetch("/api/github/repos?fresh=1");
      const body = await response.json();
      if (body?.ok && Array.isArray(body.repos)) {
        setRepos(body.repos as Repo[]);
        setError(null);
        setFilter("all");
      } else {
        setError(
          (body?.error as GitHubError) ?? {
            kind: "unavailable",
            message: "GitHub is still not responding.",
          },
        );
      }
    } catch {
      setError({
        kind: "network",
        message: "Still no connection to GitHub. Check your network and retry.",
      });
    } finally {
      setRetrying(false);
    }
  }, []);

  const categories = useMemo(
    () => (repos ? availableCategories(repos) : []),
    [repos],
  );

  const visible = useMemo(() => {
    if (!repos) return [];
    if (filter === "all") return repos;
    return repos.filter((repo) => repo.categories.includes(filter));
  }, [repos, filter]);

  if (error && !repos) {
    return <ProjectsError error={error} onRetry={retry} retrying={retrying} />;
  }
  if (!repos || repos.length === 0) return <ProjectsEmpty />;

  return (
    <div>
      {/* Filters are derived from real repository metadata, so this list
          changes on its own as the GitHub account changes. */}
      <div
        role="group"
        aria-label="Filter projects by technology"
        className="flex flex-wrap gap-1.5"
      >
        <FilterButton
          active={filter === "all"}
          onClick={() => setFilter("all")}
          count={repos.length}
        >
          All
        </FilterButton>
        {categories.map((category) => (
          <FilterButton
            key={category.id}
            active={filter === category.id}
            onClick={() => setFilter(category.id)}
            count={category.count}
          >
            {category.label}
          </FilterButton>
        ))}
      </div>

      <p aria-live="polite" className="sr-only">
        {visible.length} project{visible.length === 1 ? "" : "s"} shown.
      </p>

      <motion.ul
        layout={motionEnabled}
        className="mt-8 grid gap-px sm:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((repo) => (
            <motion.li
              key={repo.id}
              layout={motionEnabled}
              initial={motionEnabled ? { opacity: 0, scale: 0.97 } : false}
              animate={{ opacity: 1, scale: 1 }}
              exit={motionEnabled ? { opacity: 0, scale: 0.97 } : undefined}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <ProjectCard repo={repo} onOpen={setSelected} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      {visible.length === 0 && (
        <p className="text-dim border-line mt-px border p-8 text-center font-mono text-xs">
          Nothing in this category yet.
        </p>
      )}

      <RepoDialog repo={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-2 border px-3 py-1.5 font-mono text-[0.625rem] tracking-[0.14em] uppercase transition-colors duration-300",
        active
          ? "border-accent-line bg-accent/[0.07] text-accent"
          : "border-line text-muted hover:border-line-strong hover:text-fg",
      )}
    >
      {children}
      <span
        className={cn("tabular-nums", active ? "text-accent/70" : "text-dim")}
      >
        {count}
      </span>
    </button>
  );
}

/** Detail view. Everything shown here comes from the API — nothing is filled in. */
function RepoDialog({
  repo,
  onClose,
}: {
  repo: Repo | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={repo !== null}
      onClose={onClose}
      labelId="repo-dialog-title"
      title={
        repo && (
          <>
            <p className="label-key">Repository</p>
            <h3 className="mt-1.5 truncate font-mono text-lg font-medium">
              {repo.name}
            </h3>
          </>
        )
      }
    >
      {repo && (
        <div className="space-y-7">
          <p
            className={cn(
              "text-sm leading-relaxed",
              repo.description ? "text-muted" : "text-dim italic",
            )}
          >
            {repo.description ?? "No description provided on GitHub."}
          </p>

          <dl className="border-line grid grid-cols-2 gap-px border-t pt-5 sm:grid-cols-4">
            <Stat
              label="Stars"
              value={String(repo.stars)}
              icon={<Star className="h-3 w-3" />}
            />
            <Stat
              label="Forks"
              value={String(repo.forks)}
              icon={<GitFork className="h-3 w-3" />}
            />
            <Stat
              label="Language"
              value={repo.language ?? "—"}
              dot={repo.language ? languageColor(repo.language) : undefined}
            />
            <Stat
              label="License"
              value={repo.license ?? "—"}
              icon={<Scale className="h-3 w-3" />}
            />
          </dl>

          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="label-key">Created</dt>
              <dd className="text-muted mt-1.5 font-mono text-xs">
                {formatDate(repo.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="label-key">Last push</dt>
              <dd className="text-muted mt-1.5 font-mono text-xs">
                {formatDate(repo.pushedAt ?? repo.updatedAt)}
              </dd>
            </div>
          </dl>

          <div>
            <p className="label-key">Topics</p>
            {repo.topics.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {repo.topics.map((topic) => (
                  <li key={topic}>
                    <Chip>{topic}</Chip>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-dim mt-2 font-mono text-xs italic">
                No topics set on this repository.
              </p>
            )}
          </div>

          <div className="border-line flex flex-wrap gap-2 border-t pt-5">
            <ActionLink href={repo.url} variant="primary">
              <GithubIcon aria-hidden="true" className="h-3.5 w-3.5" />
              Open repository
              <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
            </ActionLink>
            {repo.homepage && (
              <ActionLink href={repo.homepage}>
                <Globe aria-hidden="true" className="h-3.5 w-3.5" />
                Live demo
                <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
              </ActionLink>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}

function Stat({
  label,
  value,
  icon,
  dot,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  dot?: string;
}) {
  return (
    <div className="py-1">
      <dt className="label-key">{label}</dt>
      <dd className="text-fg mt-1.5 flex items-center gap-1.5 truncate font-mono text-xs">
        {dot && (
          <span
            aria-hidden="true"
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: dot }}
          />
        )}
        {icon && <span className="text-dim shrink-0">{icon}</span>}
        <span className="truncate">{value}</span>
      </dd>
    </div>
  );
}
