import { Section } from "@/components/ui/section";
import { getRepos } from "@/lib/github";
import { Constellation } from "@/components/skills/constellation";

/**
 * Skills.
 *
 * Repositories are fetched here too, but this costs nothing extra: it is the
 * same cached request the Projects section made, served from Next's fetch
 * cache within the same render. If it fails, the constellation still works —
 * it just has no repositories to link to, and says so.
 */
export async function Skills() {
  const result = await getRepos();
  const repos = result.ok ? result.data : [];

  return (
    <Section
      id="skills"
      index="04"
      title="Technology"
      kicker="What I build with, and how the pieces relate. Selecting a node also pulls up the public repositories that actually use it."
    >
      <Constellation repos={repos} />
    </Section>
  );
}
