/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TECHNOLOGY GRAPH
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Powers the Skills constellation, the mobile skills grid and the terminal's
 * `skills` command.
 *
 * Deliberate design decision: there are NO proficiency percentages. Self-scored
 * "React 92%" bars are noise to a recruiter and impossible to verify. Instead
 * each node states what it is actually used for, and links to the real GitHub
 * repositories that use it via `match`.
 *
 * `match` is how a skill finds its projects: a repo counts as related when its
 * primary language or one of its topics matches. That means new repos attach
 * themselves to the right skills automatically — no manual project lists.
 */

export type SkillCategory =
  "language" | "data" | "cloud" | "automation" | "tooling" | "web";

export interface Skill {
  id: string;
  label: string;
  category: SkillCategory;
  /** One or two sentences: what it's used for, in practice. */
  blurb: string;
  /** Other skill ids that light up when this node is selected. */
  related: string[];
  /** Used to associate GitHub repositories with this skill. */
  match: {
    languages?: string[];
    topics?: string[];
  };
  /** Anchor position (0–1 space) for the constellation layout. */
  position: { x: number; y: number };
}

export const skillCategories: Record<
  SkillCategory,
  { label: string; hue: number }
> = {
  language: { label: "Languages", hue: 160 },
  data: { label: "Data", hue: 190 },
  cloud: { label: "Cloud", hue: 210 },
  automation: { label: "Automation", hue: 140 },
  tooling: { label: "Tooling", hue: 250 },
  web: { label: "Web", hue: 30 },
};

export const skills: Skill[] = [
  {
    id: "python",
    label: "Python",
    category: "language",
    blurb:
      "Primary language for automation work — file and PDF processing, Excel and Sheets manipulation, API glue and scheduled jobs.",
    related: ["uipath", "sql", "spark", "aws", "mongodb"],
    match: {
      languages: ["Python"],
      topics: ["python", "automation", "scraping", "bot", "pandas"],
    },
    position: { x: 0.3, y: 0.32 },
  },
  {
    id: "java",
    label: "Java",
    category: "language",
    blurb:
      "Backend and application work from a computer science background — typed, structured services and desktop tooling.",
    related: ["kotlin", "sql", "spark"],
    match: { languages: ["Java"], topics: ["java", "spring", "android"] },
    position: { x: 0.16, y: 0.6 },
  },
  {
    id: "kotlin",
    label: "Kotlin",
    category: "language",
    blurb:
      "Used for JVM and Android-side projects where Java's verbosity gets in the way.",
    related: ["java"],
    match: { languages: ["Kotlin"], topics: ["kotlin", "android", "compose"] },
    position: { x: 0.1, y: 0.4 },
  },
  {
    id: "sql",
    label: "SQL",
    category: "data",
    blurb:
      "Querying, shaping and validating the data that automations read from and write back into.",
    related: ["python", "mongodb", "spark", "aws"],
    match: {
      languages: ["PLpgSQL", "TSQL", "SQL"],
      topics: ["sql", "postgres", "mysql", "database", "sqlite"],
    },
    position: { x: 0.52, y: 0.2 },
  },
  {
    id: "mongodb",
    label: "MongoDB",
    category: "data",
    blurb:
      "Document storage for projects where the shape of the data changes faster than a schema comfortably can.",
    related: ["sql", "python", "java"],
    match: { topics: ["mongodb", "mongo", "nosql"] },
    position: { x: 0.66, y: 0.34 },
  },
  {
    id: "spark",
    label: "Spark",
    category: "data",
    blurb:
      "Distributed processing — the direction the MBA in Data Science is pushing toward for larger datasets.",
    related: ["python", "sql", "aws"],
    match: { topics: ["spark", "pyspark", "bigdata", "etl"] },
    position: { x: 0.8, y: 0.24 },
  },
  {
    id: "aws",
    label: "AWS",
    category: "cloud",
    blurb:
      "Current learning focus — storage, compute and managed data services, aimed at moving automations off local schedulers and into the cloud.",
    related: ["python", "spark", "sql"],
    match: {
      topics: ["aws", "lambda", "s3", "cloud", "serverless", "terraform"],
    },
    position: { x: 0.84, y: 0.55 },
  },
  {
    id: "uipath",
    label: "UiPath",
    category: "automation",
    blurb:
      "The day job: attended and unattended robots driving ERP screens, document workflows and reporting that used to be done by hand.",
    related: ["python", "sql", "excel"],
    match: { topics: ["uipath", "rpa", "robotic-process-automation"] },
    position: { x: 0.42, y: 0.62 },
  },
  {
    id: "excel",
    label: "Excel / Sheets",
    category: "automation",
    blurb:
      "Where most business processes actually live. Reading, generating and reconciling workbooks is a large slice of real automation work.",
    related: ["uipath", "python", "sql"],
    match: {
      topics: ["excel", "openpyxl", "google-sheets", "spreadsheet", "csv"],
    },
    position: { x: 0.58, y: 0.74 },
  },
  {
    id: "git",
    label: "Git",
    category: "tooling",
    blurb:
      "Branching, review and history hygiene — including for automation projects, which too often live in a shared folder instead.",
    related: ["github"],
    match: { topics: ["git"] },
    position: { x: 0.24, y: 0.82 },
  },
  {
    id: "github",
    label: "GitHub",
    category: "tooling",
    blurb:
      "Source of truth for everything public — this site reads its Projects section directly from the GitHub API.",
    related: ["git", "python"],
    match: { topics: ["github", "github-actions", "ci"] },
    position: { x: 0.38, y: 0.9 },
  },
  {
    id: "web",
    label: "HTML / CSS",
    category: "web",
    blurb:
      "Interface work — including this site, built with Next.js, TypeScript and Tailwind.",
    related: ["github"],
    match: {
      languages: ["HTML", "CSS", "TypeScript", "JavaScript"],
      topics: ["html", "css", "nextjs", "react", "tailwind", "website"],
    },
    position: { x: 0.7, y: 0.88 },
  },
];

/** Undirected edges, derived from `related` so the data stays in one place. */
export const skillEdges: [string, string][] = (() => {
  const seen = new Set<string>();
  const edges: [string, string][] = [];
  for (const skill of skills) {
    for (const other of skill.related) {
      if (!skills.some((s) => s.id === other)) continue;
      const key = [skill.id, other].sort().join("::");
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push([skill.id, other]);
    }
  }
  return edges;
})();

export const skillById = new Map(skills.map((s) => [s.id, s]));
