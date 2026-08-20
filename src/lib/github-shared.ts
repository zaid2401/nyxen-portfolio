/**
 * ─────────────────────────────────────────────────────────────────────────────
 * GITHUB — SHARED TYPES AND PURE LOGIC
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Split out from `github.ts` deliberately. `github.ts` reads `process.env` and
 * performs network calls; it must never end up in a client bundle. Client
 * components (filters, the heatmap, the detail dialog) import from *this* file
 * instead, which has no environment access and no imports of its own.
 */

export type GitHubErrorKind =
  | "not-configured"
  | "not-found"
  | "rate-limited"
  | "unauthorized"
  | "network"
  | "unavailable";

export interface GitHubError {
  kind: GitHubErrorKind;
  /** Safe to show a visitor. Never contains a token or a raw API body. */
  message: string;
  /** Extra guidance shown in development only. */
  hint?: string;
}

export type GitHubResult<T> =
  { ok: true; data: T } | { ok: false; error: GitHubError };

export interface Repo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  createdAt: string;
  updatedAt: string;
  pushedAt: string | null;
  isFork: boolean;
  isArchived: boolean;
  license: string | null;
  /** Derived, not from the API. See `deriveCategories`. */
  categories: string[];
  /** True when listed in `siteConfig.featuredRepos`. */
  featured: boolean;
}

export interface Profile {
  login: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string;
  htmlUrl: string;
  publicRepos: number;
  followers: number;
  following: number;
  createdAt: string;
  location: string | null;
  company: string | null;
  blog: string | null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CATEGORY DERIVATION
   Filters are computed from real repository metadata — language and topics —
   so a new repo lands in the right filter without touching this file.
   ═══════════════════════════════════════════════════════════════════════════ */

interface CategoryRule {
  id: string;
  label: string;
  languages?: string[];
  topics?: string[];
  /** Matched against the repo name as a last resort. */
  nameHints?: string[];
}

export const categoryRules: CategoryRule[] = [
  { id: "python", label: "Python", languages: ["Python"] },
  { id: "java", label: "Java", languages: ["Java"] },
  { id: "kotlin", label: "Kotlin", languages: ["Kotlin"] },
  {
    id: "automation",
    label: "Automation",
    topics: [
      "automation",
      "rpa",
      "uipath",
      "bot",
      "scraper",
      "scraping",
      "selenium",
      "playwright",
      "workflow",
      "cron",
      "excel",
      "openpyxl",
      "pdf",
      "google-sheets",
    ],
    nameHints: ["bot", "automation", "scraper", "auto"],
  },
  {
    id: "data",
    label: "Data",
    topics: [
      "data",
      "data-science",
      "dataset",
      "analytics",
      "etl",
      "pandas",
      "spark",
      "pyspark",
      "sql",
      "database",
      "mongodb",
      "postgres",
      "mysql",
      "machine-learning",
      "ml",
      "visualization",
    ],
  },
  {
    id: "cloud",
    label: "Cloud",
    topics: ["cloud", "serverless", "terraform", "docker", "kubernetes"],
  },
  {
    id: "web",
    label: "Web",
    languages: ["TypeScript", "JavaScript", "HTML", "CSS", "Vue", "Svelte"],
    topics: [
      "web",
      "website",
      "react",
      "nextjs",
      "frontend",
      "tailwind",
      "api",
    ],
  },
];

export function deriveCategories(
  language: string | null,
  topics: string[],
  name: string,
): string[] {
  const topicSet = new Set(topics.map((t) => t.toLowerCase()));
  const lowerName = name.toLowerCase();
  const matched: string[] = [];

  for (const rule of categoryRules) {
    const byLanguage = language
      ? (rule.languages ?? []).some(
          (l) => l.toLowerCase() === language.toLowerCase(),
        )
      : false;
    const byTopic = (rule.topics ?? []).some((t) => topicSet.has(t));
    const byName = (rule.nameHints ?? []).some((h) => lowerName.includes(h));

    if (byLanguage || byTopic || byName) matched.push(rule.id);
  }

  return matched.length > 0 ? matched : ["other"];
}

/** Category ids present in the given repos, in the canonical rule order. */
export function availableCategories(
  repos: Repo[],
): { id: string; label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const repo of repos) {
    for (const category of repo.categories) {
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
  }

  const ordered = categoryRules
    .filter((rule) => counts.has(rule.id))
    .map((rule) => ({
      id: rule.id,
      label: rule.label,
      count: counts.get(rule.id) as number,
    }));

  if (counts.has("other")) {
    ordered.push({
      id: "other",
      label: "Other",
      count: counts.get("other") as number,
    });
  }
  return ordered;
}

/**
 * Skills → repositories, matched on the repo's own language and topics. This is
 * why the Skills section stays accurate as the GitHub account changes: nothing
 * links a technology to a project by hand.
 */
export function reposForSkill(
  repos: Repo[],
  match: { languages?: string[]; topics?: string[] },
): Repo[] {
  const languages = new Set(
    (match.languages ?? []).map((l) => l.toLowerCase()),
  );
  const topics = new Set((match.topics ?? []).map((t) => t.toLowerCase()));

  return repos.filter((repo) => {
    if (repo.language && languages.has(repo.language.toLowerCase()))
      return true;
    return repo.topics.some((topic) => topics.has(topic.toLowerCase()));
  });
}
