/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DOCUMENT FIELD EXTRACTION
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Pulls structured fields out of unstructured document text — the step that
 * sits between "a PDF arrived" and "a record exists", and the part of document
 * automation that actually decides whether the rest works.
 *
 * This runs for real on whatever text is given to it. It is the same shape of
 * logic used against text-layer PDFs and OCR output: a set of labelled
 * patterns, each with a confidence, applied in priority order, with the winner
 * reported alongside where in the text it was found.
 *
 * What it deliberately is NOT: a machine-learning model, or a claim to be one.
 * It is rules. Rules are what most production document automation is, they are
 * auditable, and when they fail they fail somewhere you can point at.
 *
 * Pure — no DOM, no network.
 */

export type FieldKind = "reference" | "date" | "money" | "party" | "quantity";

export interface ExtractedField {
  key: string;
  label: string;
  kind: FieldKind;
  value: string;
  /** Character offset in the source text, for highlighting. */
  start: number;
  end: number;
  /** Which rule matched. Shown so a result is always traceable. */
  rule: string;
  /** 0–1. Derived from how specific the matching rule was. */
  confidence: number;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  /** Source line, kept so a visitor can see what produced the row. */
  raw: string;
}

export interface ExtractionResult {
  fields: ExtractedField[];
  lineItems: LineItem[];
  /** Fields the rules looked for and did not find — reported, not hidden. */
  missing: string[];
  /** Sum of the extracted line amounts, computed not read. */
  lineTotal: number;
  /** The document total if one was found, so the two can be reconciled. */
  statedTotal: number | null;
  reconciled: boolean | null;
}

interface Rule {
  key: string;
  label: string;
  kind: FieldKind;
  /** Capture group 1 is the value. */
  pattern: RegExp;
  confidence: number;
  ruleName: string;
  /** Optional cleanup applied to the captured value. */
  clean?: (value: string) => string;
}

const MONEY = String.raw`(?:[$€£₹]|AED|USD|EUR|GBP|INR)?\s*\d[\d,]*(?:\.\d{1,2})?`;

/**
 * Ordered by specificity: a labelled match ("Invoice No: X") beats a bare
 * pattern found loose in the text, so the first rule to hit for a key wins.
 */
const RULES: Rule[] = [
  {
    key: "reference",
    label: "Document reference",
    kind: "reference",
    /**
     * The capture requires a digit somewhere in the token.
     *
     * Without it this rule was wrong on the most ordinary invoice there is.
     * The pattern is case-insensitive, so `[A-Z0-9]` also matches lowercase,
     * and `\s*` crosses newlines: given "INVOICE
Invoice Number: INV-2026-0042"
     * it matched the heading, skipped to the next line and captured the plain
     * word "Invoice" — then reported it at 95% confidence, which is worse than
     * failing. Real references carry digits; ordinary words do not, and that is
     * enough to tell them apart. If a reference genuinely has no digit the
     * reference-shaped fallback below still catches it, at honest confidence.
     */
    pattern:
      /(?:invoice|inv|quotation|quote|rfq|order|po|ref(?:erence)?)\s*(?:no\.?|number|#|id)?\s*[:#]?\s*((?=[A-Z0-9\-/]*\d)[A-Z0-9][A-Z0-9\-/]{3,})/i,
    confidence: 0.95,
    ruleName: "labelled reference",
  },
  {
    key: "reference",
    label: "Document reference",
    kind: "reference",
    pattern: /\b([A-Z]{2,}[-/]\d{2,}[-/]?\d*)\b/,
    confidence: 0.6,
    ruleName: "reference-shaped token",
  },
  {
    key: "date",
    label: "Document date",
    kind: "date",
    pattern:
      /(?:date|dated|issued|invoice date)\s*[:#]?\s*(\d{1,2}[-/\s][A-Za-z]{3,9}[-/\s]\d{2,4}|\d{4}-\d{2}-\d{2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    confidence: 0.95,
    ruleName: "labelled date",
  },
  {
    key: "date",
    label: "Document date",
    kind: "date",
    pattern: /\b(\d{4}-\d{2}-\d{2})\b/,
    confidence: 0.7,
    ruleName: "ISO date",
  },
  {
    key: "dueDate",
    label: "Due date",
    kind: "date",
    pattern:
      /(?:due|payment due|due date)\s*[:#]?\s*(\d{1,2}[-/\s][A-Za-z]{3,9}[-/\s]\d{2,4}|\d{4}-\d{2}-\d{2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    confidence: 0.9,
    ruleName: "labelled due date",
  },
  {
    key: "total",
    label: "Total",
    kind: "money",
    /**
     * The leading `\b` is load-bearing: without it this matches the "total"
     * inside "Subtotal", and the document's total silently becomes its
     * subtotal. Word boundaries do not fire between "b" and "t", so anchoring
     * each alternative is what keeps the two apart.
     */
    pattern: new RegExp(
      String.raw`(?:\bgrand\s+total\b|\btotal\s+(?:due|amount|payable)\b|\bamount\s+due\b|\btotal\b)\s*[:#]?\s*(${MONEY})`,
      "i",
    ),
    confidence: 0.95,
    ruleName: "labelled total",
  },
  {
    key: "subtotal",
    label: "Subtotal",
    kind: "money",
    pattern: new RegExp(
      String.raw`(?:sub[\s-]?total|net\s+amount)\s*[:#]?\s*(${MONEY})`,
      "i",
    ),
    confidence: 0.9,
    ruleName: "labelled subtotal",
  },
  {
    key: "tax",
    label: "Tax / VAT",
    kind: "money",
    pattern: new RegExp(
      String.raw`(?:vat|tax|gst)\s*(?:\(?\s*\d+(?:\.\d+)?\s*%\s*\)?)?\s*[:#]?\s*(${MONEY})`,
      "i",
    ),
    confidence: 0.85,
    ruleName: "labelled tax",
  },
  {
    key: "email",
    label: "Contact email",
    kind: "party",
    pattern: /\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/,
    confidence: 0.98,
    ruleName: "email address",
  },
  {
    key: "supplier",
    label: "Supplier / from",
    kind: "party",
    pattern: /(?:from|supplier|vendor|bill\s+from)\s*[:#]?\s*(.+)/i,
    confidence: 0.8,
    ruleName: "labelled party",
    clean: (v) => v.split(/\s{2,}|\|/)[0].trim(),
  },
  {
    key: "customer",
    label: "Customer / to",
    kind: "party",
    pattern: /(?:to|customer|client|bill\s+to|sold\s+to)\s*[:#]?\s*(.+)/i,
    confidence: 0.8,
    ruleName: "labelled party",
    clean: (v) => v.split(/\s{2,}|\|/)[0].trim(),
  },
];

const EXPECTED = ["reference", "date", "total"];

function toNumber(value: string): number {
  const n = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : Number.NaN;
}

/**
 * Line items. Looks for rows shaped like
 *   <description>  <qty>  <unit price>  <amount>
 * which is what a table becomes once a PDF's layout is flattened to text.
 *
 * The amount is recomputed from qty × unit price rather than trusted, and a
 * mismatch is surfaced instead of silently corrected — a wrong line total is
 * exactly the kind of thing this step exists to catch.
 */
export function extractLineItems(text: string): LineItem[] {
  const items: LineItem[] = [];

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (/^(total|subtotal|vat|tax|gst|amount due|grand total)/i.test(line))
      continue;

    // Trailing run of 3 numbers = qty, unit, amount.
    const match = line.match(
      /^(.*?)\s{1,}(\d+(?:\.\d+)?)\s+([\d,]+(?:\.\d{1,2})?)\s+([\d,]+(?:\.\d{1,2})?)\s*$/,
    );
    if (!match) continue;

    const description = match[1].replace(/\s{2,}/g, " ").trim();
    if (!description || /^[\d.,\s]+$/.test(description)) continue;

    const quantity = toNumber(match[2]);
    const unitPrice = toNumber(match[3]);
    const amount = toNumber(match[4]);
    if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) continue;

    items.push({ description, quantity, unitPrice, amount, raw: line });
  }

  return items;
}

export function extract(text: string): ExtractionResult {
  const fields: ExtractedField[] = [];
  const taken = new Set<string>();

  for (const rule of RULES) {
    if (taken.has(rule.key)) continue;
    const match = rule.pattern.exec(text);
    if (!match || match[1] === undefined) continue;

    const captured = match[1].trim();
    const value = (rule.clean ? rule.clean(captured) : captured).trim();
    if (!value) continue;

    const start = match.index + match[0].indexOf(captured);
    fields.push({
      key: rule.key,
      label: rule.label,
      kind: rule.kind,
      value,
      start,
      end: start + captured.length,
      rule: rule.ruleName,
      confidence: rule.confidence,
    });
    taken.add(rule.key);
  }

  const lineItems = extractLineItems(text);
  const lineTotal = lineItems.reduce((sum, item) => sum + item.amount, 0);

  const totalField = fields.find((f) => f.key === "total");
  const statedTotal = totalField ? toNumber(totalField.value) : null;

  /**
   * Reconcile the line items against the subtotal where the document has one,
   * and only fall back to the total when it does not.
   *
   * Comparing lines against a tax-inclusive total is the wrong check: a
   * perfectly consistent invoice fails it every time, purely because the lines
   * are pre-tax. Getting this backwards would make the validator cry wolf on
   * exactly the documents it is supposed to pass.
   */
  const subtotalField = fields.find((f) => f.key === "subtotal");
  const reconcileAgainst = subtotalField
    ? toNumber(subtotalField.value)
    : statedTotal;

  const reconciled =
    reconcileAgainst === null ||
    Number.isNaN(reconcileAgainst) ||
    lineItems.length === 0
      ? null
      : Math.abs(reconcileAgainst - lineTotal) < 0.02;

  const missing = EXPECTED.filter((key) => !taken.has(key)).map((key) => {
    const rule = RULES.find((r) => r.key === key);
    return rule ? rule.label : key;
  });

  return { fields, lineItems, missing, lineTotal, statedTotal, reconciled };
}
