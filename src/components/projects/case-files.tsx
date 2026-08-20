import { Section } from "@/components/ui/section";
import { getRepos } from "@/lib/github";
import { caseFiles } from "@/data/case-files";
import { CaseFilesClient } from "@/components/projects/case-files-client";

/**
 * CASE FILES.
 *
 * Projects as engineering case studies: problem, approach, architecture,
 * implementation, result. The framing is doing real work here — a card that
 * says "Quotation Automation · Python, UiPath" tells a recruiter nothing about
 * whether the person can think, and the problem statement does.
 *
 * Repositories are resolved on the server so a case file with public code can
 * link straight to it. If GitHub is unavailable the section still renders in
 * full — the link is simply absent, which is the honest outcome.
 */
export async function CaseFiles() {
  const result = await getRepos();
  const repos = result.ok ? result.data : [];

  const repoUrls: Record<string, string> = {};
  for (const item of caseFiles) {
    if (!item.repo) continue;
    const match = repos.find(
      (repo) => repo.name.toLowerCase() === item.repo?.toLowerCase(),
    );
    if (match) repoUrls[item.id] = match.url;
  }

  return (
    <Section
      id="case-files"
      index="03"
      title="Case Files"
      kicker="Each one is a problem that existed, what was built for it, and what changed as a result. Figures appear only where they were actually measured."
    >
      <CaseFilesClient repoUrls={repoUrls} />
    </Section>
  );
}
