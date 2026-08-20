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
  | "case-files"
  | "skills"
  | "lab"
  | "github"
  | "terminal"
  | "contact";

export const siteConfig = {
  /* ── Identity ───────────────────────────────────────────────────────────── */
  brand: "Nyxen",
  name: "Zaid",
  /** Shown in <title> and OG cards. */
  title: "Nyxen — Zaid Parkar",
  role: "Software Developer & Automation Developer",
  roles: [
    "Software Developer",
    "Automation Developer",
    "Data Engineer Enthusiast",
  ],
  tagline:
    "I design automation systems, developer tooling and data pipelines that remove manual work from the day.",
  /**
   * Feeds the meta description, Open Graph, Twitter cards and the Person
   * JSON-LD.
   *
   * Written as concatenated single lines rather than a template literal on
   * purpose: a template literal keeps its newlines and indentation, and those
   * end up inside the <meta> tag verbatim, so search results and link previews
   * render the source formatting. Keep it one continuous string.
   */
  description:
    "Portfolio of Zaid, aka Nyxen — Software developer and automation " +
    "developer building automation systems, developer tools and data-driven " +
    "solutions with Python, UiPath and SQL. Exploring the world of data " +
    "engineering, building pipelines, working with data, and turning complex " +
    "problems into practical solutions. This is where I share what I build, " +
    "learn and discover along the way.",

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

  /* ── Résumé ─────────────────────────────────────────────────────────────
   * CONFIGURATION POINT. Drop a PDF into `/public` and set the path here —
   * for example "/zaid-parkar-cv.pdf" — or point this at an external URL.
   *
   * While it is empty, every "Download CV" control on the site renders in a
   * clearly-labelled unavailable state rather than linking to a 404. Nothing
   * fabricates résumé content in its place.
   */
  resumeUrl: "",

  /* ── Meta ───────────────────────────────────────────────────────────────── */
  keywords: [
    "Software developer",
    "Automation developer",
    "RPA developer",
    "UiPath",
    "Python automation",
    "Data engineering",
    "SQL",
    "portfolio",
    "Nyxen",
    "Zaid Parkar",
  ],
} as const;

export type SiteConfig = typeof siteConfig;

/** True when a config/data string is still an unreplaced placeholder. */
export function isPlaceholder(value: string | null | undefined): boolean {
  return typeof value === "string" && value.includes(PLACEHOLDER_PREFIX);
}

/** GitHub profile URL derived from the username — never hardcode this. */
export const githubUrl = `https://github.com/${siteConfig.githubUsername}`;

/**
 * Navigation model — the one place the OS shell, the mobile dock, the command
 * palette and the terminal's `open` command all read from.
 *
 * `nav` puts a section in the top toolbar. `dock` puts it in the mobile bottom
 * bar, which holds fewer items because a thumb reach is not a mouse: the four
 * that answer "what has he built and can he do it" win the space, and
 * everything else stays one tap away in the menu.
 */
export const sections: {
  id: SectionId;
  label: string;
  /** Short form for the mobile dock and narrow toolbars. */
  short?: string;
  nav: boolean;
  dock?: boolean;
}[] = [
  { id: "hero", label: "Home", nav: false, dock: true },
  { id: "about", label: "About", nav: true },
  { id: "experience", label: "Experience", short: "Exp", nav: true },
  {
    id: "case-files",
    label: "Case Files",
    short: "Cases",
    nav: true,
    dock: true,
  },
  { id: "skills", label: "Skill DNA", short: "Skills", nav: true, dock: true },
  { id: "lab", label: "Lab", nav: true, dock: true },
  { id: "github", label: "GitHub", nav: true },
  { id: "terminal", label: "Terminal", nav: false },
  { id: "contact", label: "Contact", nav: true },
];

export const navSections = sections.filter((s) => s.nav);
export const dockSections = sections.filter((s) => s.dock);
