import { Suspense } from "react";
import { Section } from "@/components/ui/section";
import { getProfile, getRepos } from "@/lib/github";
import { ProjectsClient } from "@/components/projects/projects-client";
import { ProjectsSkeleton } from "@/components/projects/project-states";
import { SystemStatus } from "@/components/os/system-status";
import { checkStatus } from "@/lib/status";
import { GithubStats } from "@/components/github/github-stats";

/**
 * GITHUB SYSTEM.
 *
 * The live half of the site. Case Files are the curated, written account of the
 * work; this is the raw feed, straight from the API, with nothing selected by
 * hand. The two answer different questions and both are worth having.
 *
 * The repository grid, filters and detail dialog are the existing, working
 * implementation — kept deliberately. The additions are the profile statistics
 * and the status panel beside them.
 *
 * The fetch sits behind `<Suspense>` so the heading and the rest of the page
 * render immediately and the grid streams in behind a skeleton.
 */
export function GithubSystem() {
  return (
    <Section
      id="github"
      index="06"
      title="GitHub System"
      kicker="Read live from the GitHub API on the server, cached hourly. Nothing on this list is hand-maintained — pushing a public repository is the entire publishing step."
    >
      <Suspense fallback={<ProjectsSkeleton />}>
        <Feed />
      </Suspense>
    </Section>
  );
}

async function Feed() {
  // Both calls hit the same cached fetch layer, so this is one round trip per
  // revalidation window, not two per request.
  const [repos, profile, status] = await Promise.all([
    getRepos(),
    getProfile(),
    checkStatus(),
  ]);

  return (
    <div className="space-y-px">
      <div className="grid gap-px lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <GithubStats
          profile={profile.ok ? profile.data : null}
          repos={repos.ok ? repos.data : []}
          failed={!profile.ok}
        />
        <SystemStatus initial={status} />
      </div>

      <div className="pt-8">
        <ProjectsClient initial={repos} />
      </div>
    </div>
  );
}
