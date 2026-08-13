import { Suspense } from "react";
import { Section } from "@/components/ui/section";
import { getRepos } from "@/lib/github";
import { ProjectsClient } from "@/components/projects/projects-client";
import { ProjectsSkeleton } from "@/components/projects/project-states";

/**
 * Projects.
 *
 * There is no hand-maintained project array anywhere in this codebase. The
 * grid is whatever `getRepos()` returns for the configured GitHub account,
 * revalidated on the window set in `siteConfig.revalidateSeconds`. Push a new
 * public repository and it appears here on the next revalidation — that is the
 * entire maintenance story.
 *
 * The fetch sits behind `<Suspense>` so the section heading and the rest of the
 * page render immediately and the grid streams in behind a skeleton.
 */
export function Projects() {
  return (
    <Section
      id="projects"
      index="03"
      title="Projects"
      kicker="Pulled live from GitHub — repositories, languages and topics come straight from the API, and this list updates itself."
    >
      <Suspense fallback={<ProjectsSkeleton />}>
        <ProjectsFeed />
      </Suspense>
    </Section>
  );
}

async function ProjectsFeed() {
  const result = await getRepos();
  return <ProjectsClient initial={result} />;
}
