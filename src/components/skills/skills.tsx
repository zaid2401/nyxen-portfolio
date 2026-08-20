import { Section } from "@/components/ui/section";
import { getRepos } from "@/lib/github";
import { Constellation } from "@/components/skills/constellation";

/**
 * SKILL DNA.
 *
 * Not a grid of badges with self-assigned percentages. Selecting a technology
 * lights its connections, the case files that used it, and the public
 * repositories that contain it — so every claim on this page resolves to
 * something you can go and check.
 *
 * Repositories are fetched here too, but this costs nothing extra: it is the
 * same cached request the GitHub section made, served from Next's fetch cache
 * within the same render. If it fails, the graph still works — it just has no
 * repositories to link to, and says so.
 */
export async function Skills() {
  const result = await getRepos();
  const repos = result.ok ? result.data : [];

  return (
    <Section
      id="skills"
      index="04"
      title="Skill DNA"
      kicker="How the pieces connect. Select a node to light its relationships, the case files that used it, and the public repositories that actually contain it."
    >
      <Constellation repos={repos} />
    </Section>
  );
}
