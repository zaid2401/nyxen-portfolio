/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CSV ENGINE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * A real RFC 4180 parser, written out rather than pulled in. Three reasons it
 * is hand-written here: it is the thing the Lab is demonstrating, a dependency
 * for ~120 lines would be the wrong trade on a page that has a performance
 * budget, and every edge case below is one that actually shows up in exported
 * spreadsheet data.
 *
 * Handles: quoted fields, escaped quotes (`""`), delimiters and newlines inside
 * quotes, CRLF and LF line endings, a UTF-8 BOM, and ragged rows.
 *
 * Everything in this file is pure. No DOM, no I/O — which is what makes it
 * safe to run on whatever a visitor pastes in.
 */

export type ColumnType = "integer" | "number" | "date" | "boolean" | "text";

export interface Column {
  name: string;
  type: ColumnType;
  /** Count of rows where this cell was empty. */
  blanks: number;
  /** Count of rows whose value did not parse as the inferred type. */
  invalid: number;
}

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
  /** Rows whose column count did not match the header. */
  ragged: number;
  delimiter: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   PARSING
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Sniffs the delimiter by counting candidates outside quoted regions in the
 * first few lines. Comma is the fallback, not the assumption — European
 * exports are frequently semicolon-delimited and silently parsing those as a
 * single column is the most common way a "working" CSV importer is wrong.
 */
export function detectDelimiter(input: string): string {
  const candidates = [",", ";", "\t", "|"];
  const sample = input.slice(0, 5000);
  let best = ",";
  let bestCount = 0;

  for (const candidate of candidates) {
    let count = 0;
    let inQuotes = false;
    for (let i = 0; i < sample.length; i++) {
      const char = sample[i];
      if (char === '"') {
        if (inQuotes && sample[i + 1] === '"') i++;
        else inQuotes = !inQuotes;
      } else if (char === candidate && !inQuotes) count++;
    }
    if (count > bestCount) {
      bestCount = count;
      best = candidate;
    }
  }
  return best;
}

export function parseCsv(input: string, delimiter?: string): ParsedCsv {
  // Strip a BOM — Excel writes one, and it otherwise becomes part of the first
  // header name, which then fails every column lookup by that name.
  const text = input.replace(/^﻿/, "");
  const sep = delimiter ?? detectDelimiter(text);

  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    // Skip the trailing empty line most files end with.
    if (row.length > 1 || row[0] !== "") rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"' && field === "") {
      inQuotes = true;
    } else if (char === sep) {
      pushField();
    } else if (char === "\r") {
      if (text[i + 1] === "\n") i++;
      pushRow();
    } else if (char === "\n") {
      pushRow();
    } else {
      field += char;
    }
  }

  // Whatever is left over after the last line ending.
  if (field !== "" || row.length > 0) pushRow();

  if (rows.length === 0) {
    return { headers: [], rows: [], ragged: 0, delimiter: sep };
  }

  const headers = rows[0].map((h, i) => h.trim() || `column_${i + 1}`);
  const body = rows.slice(1);
  const ragged = body.filter((r) => r.length !== headers.length).length;

  // Normalise width so downstream code never indexes past the end.
  const normalised = body.map((r) => {
    if (r.length === headers.length) return r;
    const copy = r.slice(0, headers.length);
    while (copy.length < headers.length) copy.push("");
    return copy;
  });

  return { headers, rows: normalised, ragged, delimiter: sep };
}

export function toCsv(headers: string[], rows: string[][]): string {
  const escape = (value: string) =>
    /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  return [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
}

/* ═══════════════════════════════════════════════════════════════════════════
   TYPE INFERENCE
   ═══════════════════════════════════════════════════════════════════════════ */

const INTEGER = /^-?\d+$/;
// Accepts 1,234.56 and 1234,56 — both appear in real exports.
const NUMBER = /^-?[\d,]*\.?\d+$/;
const BOOLEAN = /^(true|false|yes|no|y|n|0|1)$/i;
const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}$/,
  /^\d{2}\/\d{2}\/\d{4}$/,
  /^\d{2}-\d{2}-\d{4}$/,
  /^\d{4}\/\d{2}\/\d{2}$/,
];

export function looksNumeric(value: string): boolean {
  return NUMBER.test(value.trim()) && /\d/.test(value);
}

export function looksDate(value: string): boolean {
  const v = value.trim();
  if (!DATE_PATTERNS.some((re) => re.test(v))) return false;
  const parsed = Date.parse(v.replace(/\//g, "-"));
  return !Number.isNaN(parsed);
}

/** Numeric value of a cell, tolerating thousands separators. */
export function numberOf(value: string): number {
  const cleaned = value.trim().replace(/,/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : Number.NaN;
}

/** A column is typed by its dominant value shape at or above this share. */
const DOMINANCE = 0.7;

/**
 * Infers a column's type from its non-empty values.
 *
 * The rule is **dominant type, not unanimous type**. A `quantity` column of
 * 200 integers and one `"n/a"` is an integer column with one bad row — calling
 * it text instead is technically defensible and practically useless, because
 * it silently accepts the bad row and hands the problem downstream.
 *
 * Typing it as an integer means `runPipeline` rejects that row with a reason
 * naming the column and the offending value, which is the entire point of
 * having a validation stage. `invalid` carries the count so the schema view can
 * show the guess and its cost side by side.
 */
export function inferColumn(name: string, values: string[]): Column {
  let blanks = 0;
  const present: string[] = [];

  for (const value of values) {
    if (value.trim() === "") blanks++;
    else present.push(value.trim());
  }

  if (present.length === 0) {
    return { name, type: "text", blanks, invalid: 0 };
  }

  const share = (test: (v: string) => boolean) =>
    present.filter(test).length / present.length;

  // Most specific first: integer before number, so "1,2,3" is not a float
  // column, and date before boolean, so "0"/"1" columns are not misread.
  const candidates: [ColumnType, number][] = [
    ["integer", share((v) => INTEGER.test(v))],
    ["number", share(looksNumeric)],
    ["date", share(looksDate)],
    ["boolean", share((v) => BOOLEAN.test(v))],
  ];

  let type: ColumnType = "text";
  for (const [candidate, ratio] of candidates) {
    if (ratio >= DOMINANCE) {
      type = candidate;
      break;
    }
  }

  // With a type settled, count the values that would fail it. For a text
  // column this is always zero — anything is valid text.
  let invalid = 0;
  if (type === "integer")
    invalid = present.filter((v) => !INTEGER.test(v)).length;
  else if (type === "number")
    invalid = present.filter((v) => !looksNumeric(v)).length;
  else if (type === "date")
    invalid = present.filter((v) => !looksDate(v)).length;

  return { name, type, blanks, invalid };
}

export function inferSchema(parsed: ParsedCsv): Column[] {
  return parsed.headers.map((header, index) =>
    inferColumn(
      header,
      parsed.rows.map((row) => row[index] ?? ""),
    ),
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PIPELINE
   ═══════════════════════════════════════════════════════════════════════════ */

export interface Rejection {
  /** 1-based row number as it appears in the source file, header included. */
  line: number;
  reason: string;
  row: string[];
}

export interface PipelineOptions {
  /** Column names that must not be blank. */
  required: string[];
  /** Column names forming the natural key used to detect duplicates. */
  dedupeOn: string[];
  trimWhitespace: boolean;
  dropEmptyRows: boolean;
}

export interface PipelineResult {
  headers: string[];
  clean: string[][];
  rejected: Rejection[];
  duplicates: number;
  schema: Column[];
  stats: {
    read: number;
    kept: number;
    trimmed: number;
    ragged: number;
  };
  /** Per-column sums for numeric columns — the "analytics" step, done for real. */
  totals: {
    column: string;
    sum: number;
    mean: number;
    min: number;
    max: number;
  }[];
}

/**
 * The actual pipeline: normalise → validate → deduplicate → aggregate.
 *
 * Every number this returns is counted from the input the visitor supplied.
 * Nothing here is staged, and a row that is rejected genuinely does not appear
 * in the output.
 */
export function runPipeline(
  parsed: ParsedCsv,
  options: PipelineOptions,
): PipelineResult {
  const { headers } = parsed;
  const schema = inferSchema(parsed);

  const requiredIndexes = options.required
    .map((name) => headers.indexOf(name))
    .filter((i) => i >= 0);
  const keyIndexes = options.dedupeOn
    .map((name) => headers.indexOf(name))
    .filter((i) => i >= 0);

  const clean: string[][] = [];
  const rejected: Rejection[] = [];
  const seen = new Set<string>();
  let duplicates = 0;
  let trimmed = 0;

  parsed.rows.forEach((raw, index) => {
    // +2: one for the header line, one for 1-based counting.
    const line = index + 2;

    let row = raw;
    if (options.trimWhitespace) {
      const next = raw.map((cell) => cell.trim());
      if (next.some((cell, i) => cell !== raw[i])) trimmed++;
      row = next;
    }

    if (options.dropEmptyRows && row.every((cell) => cell === "")) {
      rejected.push({ line, reason: "Empty row", row });
      return;
    }

    const missing = requiredIndexes.filter((i) => row[i].trim() === "");
    if (missing.length > 0) {
      rejected.push({
        line,
        reason: `Missing required: ${missing.map((i) => headers[i]).join(", ")}`,
        row,
      });
      return;
    }

    // Type violations, checked against the inferred schema.
    const badColumn = schema.findIndex((column, i) => {
      const value = row[i]?.trim();
      if (!value) return false;
      if (column.type === "integer") return !INTEGER.test(value);
      if (column.type === "number") return !looksNumeric(value);
      if (column.type === "date") return !looksDate(value);
      return false;
    });
    if (badColumn >= 0) {
      rejected.push({
        line,
        reason: `Invalid ${schema[badColumn].type} in "${headers[badColumn]}": "${row[badColumn]}"`,
        row,
      });
      return;
    }

    if (keyIndexes.length > 0) {
      const key = keyIndexes.map((i) => row[i].toLowerCase()).join(" ");
      if (seen.has(key)) {
        duplicates++;
        rejected.push({
          line,
          reason: `Duplicate of an earlier row on (${options.dedupeOn.join(", ")})`,
          row,
        });
        return;
      }
      seen.add(key);
    }

    clean.push(row);
  });

  // Aggregate the numeric columns of what survived.
  const totals = schema
    .map((column, i) => {
      if (column.type !== "number" && column.type !== "integer") return null;

      const values = clean
        .map((row) => numberOf(row[i]))
        .filter((n) => Number.isFinite(n));
      if (values.length === 0) return null;

      /**
       * Identifiers are numeric but not quantities. "Sum of order_id" is a
       * number with no meaning, and printing it beside a real total invites
       * the reader to treat both as findings.
       *
       * Detected by name only. The tempting second signal — "every value is
       * distinct, so it must be a key" — is wrong on exactly the data this
       * tool sees most: a six-row quantity column is usually all-distinct too,
       * and suppressing it hides a real total. The asymmetry decides it. A
       * missed identifier prints one meaningless row; a missed quantity
       * silently removes a number the reader came for.
       */
      const looksLikeKey = /(^|[_\s-])(id|no|num|number|code|ref|key)s?$/i.test(
        column.name,
      );
      if (looksLikeKey) return null;
      const sum = values.reduce((a, b) => a + b, 0);
      return {
        column: column.name,
        sum,
        mean: sum / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    })
    .filter((t): t is NonNullable<typeof t> => t !== null);

  return {
    headers,
    clean,
    rejected,
    duplicates,
    schema,
    stats: {
      read: parsed.rows.length,
      kept: clean.length,
      trimmed,
      ragged: parsed.ragged,
    },
    totals,
  };
}
