# Editing NYXEN OS

Where to change things. Every file below is in `src/` and none of them require touching a component.

**The rule this site is built on:** never state a number that was not actually measured. Where you have a figure, put it in `result.metrics`. Where you do not, write `result.note` instead and leave the metrics array empty. The UI renders both cases properly and will not invent the missing half.

---

## Quick lookup

| I want to change… | Edit this file |
| --- | --- |
| Name, email, LinkedIn, GitHub username, CV link, site title | `src/config/site.ts` |
| Jobs, dates, education, the About panel and paragraphs | `src/data/experience.ts` |
| Case files (projects) | `src/data/case-files.ts` |
| Technologies and the Skill DNA graph | `src/data/skills.ts` |
| Lab tools — samples and tabs | `src/data/lab.ts` |
| Lab logic — parsing, extraction, pricing | `src/lib/lab/` |
| Hobbies, interests, why "Nyxen" | `src/data/personal.ts` |
| Which sections appear in the nav / mobile dock | `src/config/site.ts` → `sections` |
| The "Why Nyxen?" panel in the hidden archive | `src/components/easter-eggs/secret-archive.tsx` |
| Recruiter "Core areas" chips | `src/app/recruiter/page.tsx` → `CORE_AREAS` |

After any edit: `npm run typecheck` catches a mistyped field immediately.

---

## Experience — `src/data/experience.ts`

Four exports. Adding to any of them is enough; nothing else needs updating.

### `work` — jobs

```ts
{
  id: "unique-slug",              // any unique string
  role: "Automation Developer",
  company: "Company Name",
  location: "Pune, India",        // optional
  start: "2024-07",               // see date formats below
  end: "2026-07",                 // or "present"
  summary: "One or two sentences.",
  highlights: [                   // optional; lead with anything carrying a number
    "Reduced quotation creation time by 85–90%…",
  ],
  stack: ["Python", "UiPath", "SQL"],  // optional
}
```

**Dates are computed, never typed.** Give `start` and `end`, and the displayed range, the duration, the "Current" badge and the total-experience figure on the hero and recruiter page all derive from them. Accepted: `"2024-07"`, `"Jul 2024"`, `"July 2024"`, `"2024"`, and for an ongoing role `"present"` / `"current"` / `"now"`.

Writing `end: "present"` is the *only* thing that marks a role current. There is no separate flag to keep in sync.

### `education` — degrees

Same shape, with `qualification` and `institution` instead of `role` and `company`. `summary` and `stack` are optional.

### `identityRows` — the About panel table

```ts
{ key: "LOCATION", value: "Dubai, UAE" }
```

Two rows are read by name elsewhere, so keep their keys spelled exactly:
- `NAME` → the `<h1>` on the homepage and recruiter page
- `LOCATION` → the recruiter page's Location fact

`EXPERIENCE` is computed from `work` — do not hardcode it.

### `aboutParagraphs` — the prose

A plain array of strings. `aboutParagraphs[0]` is also reused as the summary on the recruiter page, and `[2]` feeds the "what are you learning" answer.

---

## Case Files — `src/data/case-files.ts`

Add an object to the `caseFiles` array.

```ts
{
  id: "unique-slug",
  index: "005",                    // shown as CASE FILE #005; keep it zero-padded
  name: "Project Name",
  summary: "One line — this is the card text.",
  context: "Company Name",         // optional; omit for personal projects
  period: "2024 — 2026",           // optional
  visibility: "internal",          // "internal" = no public code | "public" = has a repo
  repo: "repo-name",               // optional; exact GitHub repo name, resolves to a live link

  problem: "What was wrong before. Write it as a story, not a spec.",
  approach: "What you built and why it was built that way.",

  architecture: [                  // the numbered pipeline in the modal
    { label: "Retrieve", detail: "One sentence." },
  ],

  implementation: [                // bullet list — what was actually hard
    "Validation is a separate stage, so a failed row never half-writes.",
  ],

  stack: ["UiPath", "Python", "SQL"],

  result: {
    metrics: [                     // ONLY where a figure was really measured
      {
        label: "Time per quotation",
        before: "10–15 min",
        after: "1–2 min",
        delta: "85–90% faster",    // optional
      },
    ],
    note: "Qualitative outcome.",  // use this when there is no measured number
  },

  skills: ["uipath", "python"],    // skill ids from skills.ts — powers Skill DNA links
}
```

**Where each field shows up**

- `summary` + the first metric → the card in the Case Files grid
- everything → the modal, in the order problem → approach → architecture → implementation → technology → result
- every entry in `result.metrics` → the recruiter page's "Measured impact" grid
- `skills` → the "Applied in" chips when that technology is selected in Skill DNA
- `repo` → a "View source" button, but only if the repo is actually public and returned by the GitHub API

**Deleting a case file** is just removing the object. Renumber `index` if you care about the sequence; nothing breaks if you do not.

Two knock-on effects worth knowing: the hero's telemetry counts case files, and `headlineMetric` at the bottom of the file points at `caseFiles[0].result.metrics[0]`, so keep a metric on the first entry or update that export.

---

## Skills — `src/data/skills.ts`

Add to the `skills` array.

```ts
{
  id: "python",                    // lowercase slug; referenced by case-files.ts
  label: "Python",
  category: "language",            // language | data | automation | tooling | web
  blurb: "One or two sentences: what it is actually used for.",
  related: ["uipath", "sql"],      // other skill ids — this is how the lines get drawn
  match: {                         // how repos attach themselves automatically
    languages: ["Python"],
    topics: ["python", "automation"],
  },
  position: { x: 0.3, y: 0.3 },    // 0–1 space, for the desktop graph layout
}
```

Three things to know:

1. **You never draw an edge.** Declare `related` and the line appears. Ids that do not exist are silently dropped, so if a line is missing, check the spelling.
2. **`match` is how repositories link themselves.** A repo attaches when its primary language or one of its topics matches. New repos wire themselves up with no code change.
3. **`position` has no collision detection.** After adding a node, look at the desktop graph and nudge the value clear of its neighbours. The mobile view is a grid and ignores position entirely.

To add a category, extend `SkillCategory` and add an entry to `skillCategories` with a label and hue.

There are deliberately **no proficiency percentages** — the graph links to real repos and case files instead.

---

## Lab — `src/data/lab.ts` and `src/lib/lab/`

The Lab tools do **real work** on input the visitor supplies. There is no
scripted animation to edit — the numbers on screen are computed.

| What | Where |
| --- | --- |
| Tool names and descriptions (the tabs) | `src/data/lab.ts` → `labTools` |
| Starter data behind "Load sample" | `src/data/lab.ts` → `SAMPLE_CSV`, `SAMPLE_DOCUMENT`, `SAMPLE_QUOTE_LINES` |
| CSV parsing, type inference, validation, aggregation | `src/lib/lab/csv.ts` |
| Document field rules and line-item detection | `src/lib/lab/extract.ts` |
| Quotation validation, pricing and rendering | `src/lib/lab/quote.ts` |
| The panels themselves | `src/components/lab/` |

### Changing the sample data

Just edit the constants. Keep the samples **dirty** — the current CSV
deliberately contains a duplicate row, a blank required field, a non-numeric
value in a numeric column, a quoted comma, an escaped quote and a newline
inside a quoted field. A clean sample makes the tool look like it does nothing.

### Adding a document extraction rule

In `src/lib/lab/extract.ts`, add to the `RULES` array:

```ts
{
  key: "poNumber",              // one winner per key; first match wins
  label: "PO number",           // shown in the UI
  kind: "reference",            // reference | date | money | party | quantity
  pattern: /purchase\s+order\s*[:#]?\s*([A-Z0-9-]+)/i,  // group 1 is the value
  confidence: 0.9,              // shown next to the result
  ruleName: "labelled PO",      // shown so a result is traceable
}
```

Rules are tried in array order, so put the specific labelled pattern above the
loose fallback. Add the key to `EXPECTED` if a document without it should be
reported as missing.

**Watch the word boundaries.** The `total` rule needs `\btotal\b`, because
without it the pattern matches inside "Sub**total**" and the document's total
silently becomes its subtotal.

### Changing pipeline behaviour

`DOMINANCE` in `csv.ts` (default `0.7`) sets how much of a column must fit a
type before it is inferred as that type. At 0.7 a quantity column with one
`"n/a"` is still an integer column, and that one row gets rejected with a
reason naming the value — which is the point. Raise it toward 1.0 to make
inference stricter.

Aggregates skip columns whose name looks like an identifier (`id`, `no`,
`ref`, `code`, `key`), since "sum of order_id" is a number with no meaning.
Edit that regex in `runPipeline` to change what counts.

### Adding a whole new tool

1. Write the logic as pure functions in `src/lib/lab/<name>.ts` — no DOM, no
   network. That is what makes it testable and safe to run on pasted input.
2. Build the panel in `src/components/lab/<name>.tsx` using `ToolFrame`,
   `ToolSection`, `DataInput`, `Stat`, `TableScroll` and `ResultActions` from
   `lab-shell.tsx`, so it matches the others for free.
3. Add an entry to `labTools` and a branch in `src/components/lab/lab.tsx`.

**The one rule:** the "RUNS FOR REAL" badge must keep being true. If a tool
ever stops computing its output from the visitor's input, either fix it or
change the badge.

---

## Personal — `src/data/personal.ts`

The story behind the name. **Empty by design** — everything else on this site is
derived from work history, repositories or code, and this cannot be, so only you
can write it.

```ts
export const personal: Personal = {
  whyNyxen: "The story behind the handle, in a sentence or two.",
};
```

Its one consumer treats it as optional, so the site is complete while it is
null. Fill it in and the hidden archive's "Why Nyxen?" panel shows your text
instead of the author-slot placeholder. Leaving it null keeps that placeholder,
which is the intended behaviour — not a bug to work around.

---

## Navigation — `src/config/site.ts`

```ts
{ id: "case-files", label: "Case Files", short: "Cases", nav: true, dock: true }
```

- `nav: true` → appears in the desktop toolbar
- `dock: true` → appears in the mobile bottom bar (keep this to about four)
- `short` → used in the dock and on narrow toolbars

Adding an id here requires adding it to the `SectionId` union at the top of the same file, and rendering a matching `<Section id="…">` in `src/app/(os)/page.tsx`. A nav entry pointing at a section that does not exist is a dead button.

---

## Résumé

`siteConfig.resumeUrl` is empty. Drop a PDF into `/public` and set:

```ts
resumeUrl: "/zaid-parkar-cv.pdf",
```

Until then, every "Download CV" control renders a clearly-labelled "CV on request" state rather than linking to a 404.
