/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CASE FILES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Projects presented as engineering case studies rather than cards: the problem
 * that existed, the approach taken, the technology involved, and the measured
 * result.
 *
 * REAL INFORMATION RULE — every claim in this file traces back to something
 * already documented in `src/data/experience.ts` or to this repository itself.
 * Nothing is rounded up, extrapolated or invented to look impressive.
 *
 * `result.metrics` is only populated where a figure is actually documented. A
 * case with no measured number says so in `result.note` instead of guessing —
 * "improved efficiency" with no number attached is more honest than an invented
 * percentage, and a recruiter can tell the difference.
 *
 * `repo` links a case to a public GitHub repository by exact name. Most of this
 * work was internal and has no public code; `visibility: "internal"` marks that
 * explicitly, so the absence of a link is never mistaken for a broken one.
 */

export type CaseVisibility = "internal" | "public";

export interface CaseMetric {
  /** e.g. "Time per quotation" */
  label: string;
  before: string;
  after: string;
  /** The headline delta, only where it is documented. */
  delta?: string;
}

export interface CaseStage {
  /** Short verb phrase — "Extract", "Validate". */
  label: string;
  detail: string;
}

export interface CaseFile {
  id: string;
  /** Zero-padded, rendered as CASE FILE #001. */
  index: string;
  name: string;
  /** One line, shown on the card. */
  summary: string;
  /** Where the work happened. Omitted for personal projects. */
  context?: string;
  period?: string;
  visibility: CaseVisibility;
  /** Exact GitHub repository name, when the code is public. */
  repo?: string;
  problem: string;
  approach: string;
  /** The pipeline, stage by stage. Rendered as the architecture flow. */
  architecture: CaseStage[];
  /** Implementation notes — what was actually hard. */
  implementation: string[];
  stack: string[];
  result: {
    metrics: CaseMetric[];
    /** Outcomes that are real but not numeric. */
    note?: string;
  };
  /** Links this case to skill ids in `src/data/skills.ts`. */
  skills: string[];
}

const COMPANY = "Satchitanand Jigs And Fixtures";
const PERIOD = "2024 — 2026";

export const caseFiles: CaseFile[] = [
  {
    id: "quotation-automation",
    index: "001",
    name: "Quotation Automation",
    summary:
      "ERP quotation generation driven from spreadsheet data, replacing a manual ten-to-fifteen minute routine.",
    context: COMPANY,
    period: PERIOD,
    visibility: "internal",
    problem:
      "Every customer quotation was assembled by hand. Someone opened the source spreadsheet, read the line items, re-typed them into the ERP screen, cross-checked the figures and generated the document. It took ten to fifteen minutes per quotation, it happened many times a day, and because it was typing, it was where the mistakes came from.",
    approach:
      "The process was mapped end to end before anything was automated — which fields are authoritative, which are derived, and what makes a row invalid. Only then was it built: a routine pulls the sheet data through the Google Sheets API, validates it against the expected shape, and drives the ERP through UiPath to produce the quotation. Validation runs before the ERP is touched, so a bad row fails loudly instead of producing a wrong quotation quietly.",
    architecture: [
      {
        label: "Retrieve",
        detail: "Pull the current row set from Google Sheets via the API.",
      },
      {
        label: "Validate",
        detail: "Check required fields, types and business rules before use.",
      },
      {
        label: "Transform",
        detail: "Map sheet columns onto the ERP quotation field model.",
      },
      {
        label: "Generate",
        detail: "Drive the ERP through UiPath to create the quotation.",
      },
      {
        label: "Confirm",
        detail: "Verify the created record and report the outcome.",
      },
    ],
    implementation: [
      "Validation is a separate stage rather than a scatter of inline checks — a failed row stops before the ERP is touched, so there is no partial write to undo.",
      "The ERP exposes no API for this operation, so the interaction is driven at the UI layer through UiPath, with explicit waits on state rather than fixed sleeps.",
      "The sheet is treated as untrusted input: changed column order and blank rows are expected conditions, not crashes.",
    ],
    stack: ["UiPath", "Python", "Google Sheets API", "ERP", "Excel"],
    result: {
      metrics: [
        {
          label: "Time per quotation",
          before: "10–15 min",
          after: "1–2 min",
          delta: "85–90% faster",
        },
        {
          label: "Manual work removed",
          before: "10+ hrs / week",
          after: "Automated",
        },
      ],
    },
    skills: ["uipath", "python", "sql"],
  },
  {
    id: "leave-management-bot",
    index: "002",
    name: "Leave Management Bot",
    summary:
      "A leave request that routes itself: form to manager to HR to employee, over WhatsApp, with no one chasing anyone.",
    context: COMPANY,
    period: PERIOD,
    visibility: "internal",
    problem:
      "Applying for leave meant finding your manager, getting a yes, then making sure HR heard about it. Every step depended on someone remembering to pass the message on. Requests stalled in the middle with nobody sure whose turn it was, and the employee — the one person who needed the answer — was usually the last to hear anything.",
    approach:
      "The request became a Google Form, and Apps Script turned the response into a state machine. On submission the bot sends the request to the manager over the WhatsApp Business API and waits. A manager approval moves it to HR; an HR approval closes it and notifies the employee. A rejection at either stage ends it immediately and tells the employee, so a request is never silently parked. The chain is the system, not a convention people have to follow.",
    architecture: [
      {
        label: "Submit",
        detail:
          "Employee completes the Google Form; the response lands in Sheets.",
      },
      {
        label: "Notify manager",
        detail: "Apps Script sends the request to the manager over WhatsApp.",
      },
      {
        label: "Manager decision",
        detail: "Approve routes it onward to HR; reject ends the request here.",
      },
      {
        label: "HR decision",
        detail: "Approve confirms the leave; reject ends the request.",
      },
      {
        label: "Notify employee",
        detail:
          "The outcome — approved or rejected — goes back to the employee.",
      },
    ],
    implementation: [
      'Every request carries an explicit state, so the answer to "where is this?" is a field rather than someone\'s memory.',
      "A rejection at either stage terminates the chain immediately and notifies the employee. The failure path is a first-class outcome, not an unhandled branch that leaves a request in limbo.",
      "Notifications are keyed to the request, so a re-run cannot send a second approval message for a decision that has already been made.",
    ],
    stack: [
      "Google Apps Script",
      "Google Forms",
      "Google Sheets",
      "WhatsApp Business API",
      "JavaScript",
    ],
    result: {
      metrics: [],
      note: "Removed the chasing from the middle of the process: the request moves itself between manager, HR and employee, and everyone learns the outcome without asking. No timing figure was recorded for this one, so none is claimed.",
    },
    skills: ["apps-script", "web"],
  },
  {
    id: "reporting-workflows",
    index: "003",
    name: "Invoice & Reporting Workflows",
    summary:
      "Automations across invoice processing, sales reporting, BOM extraction and document handling.",
    context: COMPANY,
    period: PERIOD,
    visibility: "internal",
    problem:
      "Reporting and invoice handling were spread across spreadsheets, PDFs and the ERP, and each report was rebuilt by hand every cycle. The cost was not only the hours — it was that two people building the same report manually produced two slightly different numbers.",
    approach:
      "Each workflow was automated separately but against one shared shape: extract from the source of record, validate, then produce the output. Bills of materials and invoice data are read out of their documents, checked, and written into the reporting layer, so a report becomes a function of the data rather than of whoever assembled it.",
    architecture: [
      { label: "Ingest", detail: "Read invoices, BOMs and ERP exports." },
      {
        label: "Parse",
        detail: "Pull structured fields out of documents and sheets.",
      },
      { label: "Validate", detail: "Reconcile against the source of record." },
      { label: "Load", detail: "Write the checked data into the report set." },
      { label: "Report", detail: "Produce the output on a fixed schedule." },
    ],
    implementation: [
      "Reports regenerate from source data every cycle rather than being edited in place, so there is no drift between runs.",
      "Document parsing falls back to OCR only where the source is genuinely an image — text-layer PDFs are read directly, which is both faster and exact.",
      "Reconciliation failures surface as a report of their own instead of being quietly corrected.",
    ],
    stack: ["UiPath", "Python", "SQL", "Excel", "PDF", "OCR"],
    result: {
      metrics: [],
      note: "Improved reporting accuracy and operational efficiency. These workflows were part of the 6+ automation solutions built and deployed in the role.",
    },
    skills: ["uipath", "python", "sql", "powerbi"],
  },
  {
    id: "nyxen-os",
    index: "004",
    name: "NYXEN — this site",
    summary:
      "This site. A portfolio that reads its own project list from the GitHub API, so it cannot go stale.",
    period: "2026",
    visibility: "public",
    repo: "nyxen-portfolio",
    problem:
      "Portfolios rot. The project list is hand-written, so it reflects whatever was true on the day it was last edited — usually the day before the last job search ended. The maintenance cost is exactly why nobody pays it.",
    approach:
      "There is no hand-maintained project array in this codebase. The GitHub section is whatever the API returns for the configured account, cached on an ISR window, so pushing a public repository is the entire publishing step. The same data links technologies to the repositories that actually use them, which means the skill graph cannot claim a technology that no code backs up.",
    architecture: [
      {
        label: "Fetch",
        detail: "Server-side GitHub call; the token never reaches the browser.",
      },
      {
        label: "Validate",
        detail: "Every field from the API is checked before it reaches JSX.",
      },
      {
        label: "Derive",
        detail: "Categories and skill links computed from language and topics.",
      },
      {
        label: "Cache",
        detail: "Incremental static regeneration on a one-hour window.",
      },
      {
        label: "Degrade",
        detail: "Named failure states instead of an empty grid.",
      },
    ],
    implementation: [
      "The data layer never throws: every call returns a discriminated result, so the UI always has a concrete state to render — data, or a specific readable failure.",
      "Server-only modules are split from shared types, so environment access can never be pulled into the client bundle.",
      "Every animation is gated on one flag combining the effects switch with prefers-reduced-motion, so no component can accidentally ignore the accessibility setting.",
    ],
    stack: ["Next.js", "TypeScript", "Tailwind", "React", "GitHub API"],
    result: {
      metrics: [],
      note: "Adding a public repository updates the site with no code change and no deploy.",
    },
    skills: ["typescript", "web", "github", "git"],
  },
];

export const caseFileById = new Map(caseFiles.map((c) => [c.id, c]));

/** Case files that reference a given skill id. Used by Skill DNA. */
export function caseFilesForSkill(skillId: string): CaseFile[] {
  return caseFiles.filter((c) => c.skills.includes(skillId));
}

/** The one documented headline figure, used by Recruiter Mode. */
export const headlineMetric = caseFiles[0].result.metrics[0];
