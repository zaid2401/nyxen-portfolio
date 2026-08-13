/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SITE CONFIGURATION — single source of truth
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * This is the ONLY file you need to edit to personalise identity, links and
 * GitHub integration. Nothing else in the codebase hardcodes these values.
 *
 * Anything wrapped in `placeholder()` renders a visible "PLACEHOLDER" badge in
 * development only, so you can find and replace it. In production builds the
 * badge disappears and the raw value is shown.
 *
 * TODO(you): replace every value marked PLACEHOLDER below.
 */

/** Marks a value as a placeholder so the UI can flag it during development. */
export const PLACEHOLDER_PREFIX = "‹" as const;

export type SectionId =
  | "hero"
  | "about"
  | "experience"
  | "projects"
  | "skills"
  | "terminal"
  | "contact";

export const siteConfig = {
  /* ── Identity ───────────────────────────────────────────────────────────── */
  brand: "Nyxen",
  name: "Zaid",
  /** Shown in <title> and OG cards. */
  title: "The Nyxens Archive",
  role: "Software Developer & Automation Developer",
  roles: [
    "Software Developer",
    "Automation Developer",
    "Data Engineer Enthusiast",
  ],
  tagline:
    "I design automation systems, developer tooling and data pipelines that remove manual work from the day.",
  description: `Portfolio of Zaid, aka Nyxen — 
    Software developer and automation developer building automation systems, 
    developer tools and data-driven solutions with Python, UiPath, SQL and AWS.
    Exploring the world of data engineering, building pipelines, working with data, 
    and turning complex problems into practical solutions.
    This is where i share what i build, learn and discover along the way.`,

  /* ── Deployment ─────────────────────────────────────────────────────────── */
  domain: "nyxen.website",
  url: "https://nyxen.website",
  locale: "en_US",

  /* ── GitHub ─────────────────────────────────────────────────────────────── */
  /**
   * Set this to your GitHub username and the Projects and Skills sections
   * wire themselves up automatically. New public repos appear on the next
   * revalidation (see `revalidateSeconds`) with no code changes.
   */
  githubUsername: "zaid2401",

  /** ISR window for GitHub data, in seconds. 1 hour is a good default. */
  revalidateSeconds: 3600,

  /** Repos you never want listed, by exact name. */
  excludedRepos: [] as string[],

  /** Repos pinned to the front of the Projects grid, in order, by exact name. */
  featuredRepos: [] as string[],

  /** Forks are usually noise in a portfolio. Flip to true to show them. */
  includeForks: false,

  /** Archived repos are hidden by default but still count as real work. */
  includeArchived: false,

  /* ── Contact & socials ──────────────────────────────────────────────────── */
  email: "contact.zaidparkar@gmail.com",
  linkedin: "https://www.linkedin.com/in/zaid-parkar-b67a5a271",
  /** Optional. Leave empty to hide the resume action everywhere. */
  resumeUrl: "",

  /* ── Meta ───────────────────────────────────────────────────────────────── */
  keywords: [
    "Software developer",
    "Automation developer",
    "UiPath",
    "Python automation",
    "Data engineering",
    "portfolio",
    "Nyxen",
    "Zaid",
  ],
} as const;

export type SiteConfig = typeof siteConfig;

/** True when a config/data string is still an unreplaced placeholder. */
export function isPlaceholder(value: string | null | undefined): boolean {
  return typeof value === "string" && value.includes(PLACEHOLDER_PREFIX);
}

/** GitHub profile URL derived from the username — never hardcode this. */
export const githubUrl = `https://github.com/${siteConfig.githubUsername}`;

/** Navigation model. `nav: false` keeps a section out of the top bar. */
export const sections: {
  id: SectionId;
  label: string;
  nav: boolean;
}[] = [
  { id: "hero", label: "Home", nav: false },
  { id: "about", label: "About", nav: true },
  { id: "experience", label: "Experience", nav: true },
  { id: "projects", label: "Projects", nav: true },
  { id: "skills", label: "Skills", nav: true },
  { id: "terminal", label: "Terminal", nav: false },
  { id: "contact", label: "Contact", nav: true },
];

export const navSections = sections.filter((s) => s.nav);
