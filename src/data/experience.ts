/**
 * ─────────────────────────────────────────────────────────────────────────────
 * WORK AND EDUCATION
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Two separate lists. Work is a career history; study is not. They render as
 * two distinct blocks in the Experience section rather than one interleaved
 * timeline.
 *
 * DATES: give a `start` and an `end` and everything else is computed — the
 * displayed range, the duration, and the "Current" marker. There is no manual
 * flag to keep in sync.
 *
 *     start: "2024-07"   end: "2026-07"    → Jul 2024 — Jul 2026 · 2 yr 1 mo
 *     start: "2024-07"   end: "present"    → Jul 2024 — Present  · 2 yr 2 mo  + CURRENT
 *     start: "2021"      end: "2024"       → 2021 — 2024         · 4 yr
 *
 * Accepted: "2024-07", "Jul 2024", "July 2024", "2024", and for an ongoing
 * role any of "present" / "current" / "now" / "ongoing".
 *
 * The total on the About panel is derived from `work` below, with overlapping
 * roles counted once — so it is always right without you editing it.
 */

import { formatTotalExperience } from "@/lib/duration";

export interface WorkEntry {
  id: string;
  role: string;
  company: string;
  location?: string;
  /** See the date notes above. */
  start: string;
  /** An end date, or "present" for an ongoing role. */
  end: string;
  summary: string;
  /** Concrete outcomes. Lead with the ones carrying real numbers. */
  highlights?: string[];
  stack?: string[];
}

export interface EducationEntry {
  id: string;
  qualification: string;
  institution: string;
  location?: string;
  start: string;
  end: string;
  summary?: string;
  stack?: string[];
}

/* ── Work ─────────────────────────────────────────────────────────────────── */

export const work: WorkEntry[] = [
  {
    id: "automation-developer-sjf",
    role: "Automation Developer",
    company: "Satchitanand Jigs And Fixtures",
    location: "Pune, India",
    start: "2024-07",
    // Change to "present" if you are still in this role — the Current marker
    // and the running duration switch on by themselves.
    end: "2026-07",
    summary:
      "Built and maintained robotic process automation for business operations: ERP data entry, document processing and reporting workflows that previously ran by hand.",
    highlights: [
      "Reduced quotation creation time by 85–90%, from 10–15 minutes to roughly 1–2 minutes, through ERP automation.",
      "Automated Google Sheets data retrieval, validation and ERP quotation generation, saving 10+ hours of manual work per week.",
      "Developed and deployed 6+ automation solutions with UiPath and Python to streamline operations and minimise manual intervention.",
      "Designed workflows for invoice processing, sales reporting, BOM extraction and document handling, improving reporting accuracy and operational efficiency.",
      "Wrote Python automation to process email attachments, extract ZIP files, print documents and archive completed jobs, removing a standing manual task.",
    ],
    stack: [
      "Python",
      "UiPath",
      "SQL",
      "ERP",
      "Excel",
      "APIs",
      "OCR",
      "PDF",
      "AI integration",
    ],
  },
];

/* ── Education ────────────────────────────────────────────────────────────── */

export const education: EducationEntry[] = [
  {
    id: "mba-data-science",
    qualification: "MBA, Data Science",
    institution: "Lovely Professional University",
    start: "2024",
    end: "present",
    summary:
      "Studying data science alongside full-time work — statistics, data modelling and analytics engineering — with the goal of moving into data engineering.",
    stack: ["SQL", "Python", "Power BI", "Tableau", "Excel"],
  },
  {
    id: "bsc-cs",
    qualification: "BSc, Computer Science",
    institution: "Mumbai University",
    start: "2021",
    end: "2024",
    summary:
      "Computer science fundamentals — data structures, databases, operating systems and software engineering — which is where the Java, Kotlin and SQL work started.",
    stack: [
      "Java",
      "Kotlin",
      "C++",
      "Python",
      "SQL",
      "MongoDB",
      "Git",
      "Linux",
    ],
  },
];

/* ── About panel ──────────────────────────────────────────────────────────── */

/**
 * Short factual rows for the About "system information" panel.
 * EXPERIENCE is computed from `work` — it is never a number you have to
 * remember to bump.
 */
export const identityRows: { key: string; value: string }[] = [
  { key: "NAME", value: "Zaid Parkar" },
  { key: "HANDLE", value: "Nyxen" },
  { key: "ROLE", value: "Software & Automation Developer" },
  { key: "EXPERIENCE", value: formatTotalExperience(work) },
  { key: "EDUCATION", value: "BSc Computer Science" },
  { key: "CURRENTLY", value: "MBA — Data Science" },
  { key: "FOCUS", value: "Software development / Data engineering" },
  { key: "LOCATION", value: "Dubai, UAE" },
  { key: "STATUS", value: "Open to opportunities" },
];

/** The prose block in the About section. Keep it honest and short. */
export const aboutParagraphs: string[] = [
  "I'm a developer with 2+ years of experience turning repetitive business processes into automated systems — the kind of work where a six-hour manual routine becomes a scheduled job nobody has to think about again.",
  "Most of that work lived around ERP systems, spreadsheets and documents: reading them, validating them, moving data between systems that were never designed to talk to each other. The interesting part is rarely the bot — it's mapping the process well enough that automating it is safe.",
  "I'm now studying for an MBA in Data Science and moving toward software development and data engineering, which is the natural next step: the same instinct for pipelines, at a larger scale.",
];
