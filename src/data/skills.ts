/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TECHNOLOGY GRAPH
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Powers the Skills constellation, the mobile skills grid and the terminal's
 * `skills` command. All three read this one array — add an entry here and it
 * appears in every one of them.
 *
 * Deliberate design decision: there are NO proficiency percentages. Self-scored
 * "React 92%" bars are noise to a recruiter and impossible to verify. Instead
 * each node states what it is actually used for, and links to the real GitHub
 * repositories that use it via `match`.
 *
 * `match` is how a skill finds its projects: a repo counts as related when its
 * primary language or one of its topics matches. That means new repos attach
 * themselves to the right skills automatically — no manual project lists.
 *
 * `related` is how the connecting lines are drawn. You never draw an edge; you
 * declare a relationship and `skillEdges` at the bottom builds the line. Ids
 * that don't exist are silently dropped, so if a line is missing, check the
 * spelling.
 *
 * `position` is the one manual value — x and y in 0–1 space, mapped to 6–94%
 * horizontally and 8–92% vertically. There is no collision detection, so after
 * adding a node, look at the desktop graph and nudge it clear of its
 * neighbours.
 */

export type SkillCategory =
  | "language"
  | "data"
  | "automation"
  | "tooling"
  | "web";

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
  automation: { label: "Automation", hue: 140 },
  tooling: { label: "Tooling", hue: 250 },
  web: { label: "Web", hue: 30 },
};

export const skills: Skill[] = [
  /* ── Languages ──────────────────────────────────────────────────────────── */
  {
    id: "kotlin",
    label: "Kotlin",
    category: "language",
    blurb:
      "Used for JVM and Android-side projects where Java's verbosity gets in the way.",
    related: ["java"],
    match: { languages: ["Kotlin"], topics: ["kotlin", "android", "compose"] },
    position: { x: 0.1, y: 0.18 },
  },
  {
    id: "java",
    label: "Java",
    category: "language",
    blurb:
      "Backend and application work from a computer science background — typed, structured services and desktop tooling.",
    related: ["kotlin", "sql", "mongodb"],
    match: { languages: ["Java"], topics: ["java", "spring", "android"] },
    position: { x: 0.1, y: 0.42 },
  },
  {
    id: "python",
    label: "Python",
    category: "language",
    blurb:
      "Primary language for automation work — file and PDF processing, spreadsheet manipulation, API glue and scheduled jobs.",
    related: ["uipath", "sql", "mongodb", "typescript"],
    match: {
      languages: ["Python"],
      topics: ["python", "automation", "scraping", "bot", "pandas"],
    },
    position: { x: 0.3, y: 0.3 },
  },
  {
    id: "typescript",
    label: "TypeScript",
    category: "language",
    blurb:
      "Typed JavaScript for application and interface work — including this site, where the type system is what keeps the GitHub API data honest before it reaches the page.",
    related: ["web", "python", "github"],
    match: {
      languages: ["TypeScript", "JavaScript"],
      topics: ["typescript", "javascript", "nextjs", "react", "node"],
    },
    position: { x: 0.34, y: 0.08 },
  },

  /* ── Data ───────────────────────────────────────────────────────────────── */
  {
    id: "sql",
    label: "SQL",
    category: "data",
    blurb:
      "Querying, shaping and validating the data that automations read from and write back into.",
    related: ["python", "mongodb", "powerbi", "java"],
    match: {
      languages: ["PLpgSQL", "TSQL", "SQL"],
      topics: ["sql", "postgres", "mysql", "database", "sqlite"],
    },
    position: { x: 0.58, y: 0.18 },
  },
  {
    id: "mongodb",
    label: "MongoDB",
    category: "data",
    blurb:
      "Document storage for projects where the shape of the data changes faster than a schema comfortably can.",
    related: ["sql", "python", "java"],
    match: { topics: ["mongodb", "mongo", "nosql"] },
    position: { x: 0.8, y: 0.3 },
  },
  {
    id: "powerbi",
    label: "Power BI",
    category: "data",
    blurb:
      "The presentation layer on top of the SQL work — turning operational data into dashboards the people who need it can actually read.",
    related: ["sql", "python"],
    match: {
      topics: ["powerbi", "power-bi", "dashboard", "reporting", "dax", "bi"],
    },
    position: { x: 0.82, y: 0.6 },
  },

  /* ── Automation ─────────────────────────────────────────────────────────── */
  {
    id: "uipath",
    label: "UiPath",
    category: "automation",
    blurb:
      "Attended and unattended robots driving ERP screens, document workflows and reporting that used to be done by hand.",
    related: ["python", "sql"],
    match: { topics: ["uipath", "rpa", "robotic-process-automation"] },
    position: { x: 0.4, y: 0.55 },
  },

  /* ── Tooling ────────────────────────────────────────────────────────────── */
  {
    id: "git",
    label: "Git",
    category: "tooling",
    blurb:
      "Branching, review and history hygiene — including for automation projects, which too often live in a shared folder instead.",
    related: ["github"],
    match: { topics: ["git"] },
    position: { x: 0.14, y: 0.72 },
  },
  {
    id: "github",
    label: "GitHub",
    category: "tooling",
    blurb:
      "Source of truth for everything public — this site reads its Projects section directly from the GitHub API.",
    related: ["git", "typescript"],
    match: { topics: ["github", "github-actions", "ci"] },
    position: { x: 0.36, y: 0.86 },
  },

  /* ── Web ────────────────────────────────────────────────────────────────── */
  {
    id: "web",
    label: "HTML / CSS",
    category: "web",
    blurb:
      "Interface work — layout, responsive behaviour and accessible markup, including this site, built with Next.js and Tailwind.",
    related: ["typescript", "github"],
    match: {
      languages: ["HTML", "CSS"],
      topics: ["html", "css", "tailwind", "website", "frontend"],
    },
    position: { x: 0.66, y: 0.82 },
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
