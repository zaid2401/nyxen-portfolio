/**
 * ─────────────────────────────────────────────────────────────────────────────
 * LAB ENGINE CHECKS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The Lab claims to do real work rather than animate a scripted story, and this
 * file is what makes that claim checkable. It exercises the three engines —
 * the CSV parser and validation pipeline, the document field extractor and the
 * quotation builder — against the awkward inputs that actually break them:
 * quoted commas, doubled quotes, newlines inside fields, CRLF, a BOM, duplicate
 * rows, blank required cells, "Subtotal" sitting inside a total-matching rule,
 * and float arithmetic that must not drift.
 *
 * Four real engine bugs were found this way, so the suite earns its keep.
 *
 * Run it with `npm test`. No test framework and no dependency: Node strips the
 * types itself, the assertions are a counter and a function, and a failure
 * exits non-zero so CI notices.
 */

import {
  parseCsv,
  inferSchema,
  runPipeline,
  toCsv,
} from "../src/lib/lab/csv.ts";
import { extract } from "../src/lib/lab/extract.ts";
import { buildQuote, renderQuote } from "../src/lib/lab/quote.ts";

let pass = 0,
  fail = 0;
function check(name: string, cond: boolean, extra?: unknown) {
  if (cond) {
    pass++;
    console.log("  ok   " + name);
  } else {
    fail++;
    console.log("  FAIL " + name, extra ?? "");
  }
}

console.log("── CSV parser ──");
const tricky = `order_id,customer,"notes",amount,ordered_on
1001,Acme Ltd,"said ""urgent"", call first",1250.50,2026-01-14
1002,Beta LLC,"multi
line note",890,2026-01-15
1002,Beta LLC,"dupe",890,2026-01-15
1003,,"missing customer",70,2026-01-16
1004,Delta,"bad number",n/a,2026-01-17
`;
const parsed = parseCsv(tricky);
check(
  "headers parsed",
  parsed.headers.join("|") === "order_id|customer|notes|amount|ordered_on",
  parsed.headers,
);
check("row count", parsed.rows.length === 5, parsed.rows.length);
check(
  "escaped quotes",
  parsed.rows[0][2] === 'said "urgent", call first',
  parsed.rows[0][2],
);
check(
  "newline inside quotes",
  parsed.rows[1][2] === "multi\nline note",
  JSON.stringify(parsed.rows[1][2]),
);
check("delimiter detected", parsed.delimiter === ",", parsed.delimiter);

console.log("── semicolon + BOM ──");
const euro = parseCsv("﻿a;b;c\n1;2;3\n");
check("BOM stripped", euro.headers[0] === "a", euro.headers[0]);
check("semicolon detected", euro.delimiter === ";", euro.delimiter);

console.log("── schema inference ──");
const schema = inferSchema(parsed);
check("id is integer", schema[0].type === "integer", schema[0]);
check(
  "amount typed by dominance despite n/a",
  schema[3].type === "number",
  schema[3],
);
check("bad value counted invalid", schema[3].invalid === 1, schema[3]);
check("date column detected", schema[4].type === "date", schema[4]);
check("blank counted", schema[1].blanks === 1, schema[1]);

console.log("── pipeline ──");
const result = runPipeline(parsed, {
  required: ["customer"],
  dedupeOn: ["order_id"],
  trimWhitespace: true,
  dropEmptyRows: true,
});
check("read count", result.stats.read === 5, result.stats);
check("duplicate caught", result.duplicates === 1, result.duplicates);
check(
  "bad numeric row rejected",
  result.rejected.some((r) => /Invalid number/.test(r.reason)),
  result.rejected.map((r) => r.reason),
);
check(
  "missing required caught",
  result.rejected.some((r) => /Missing required/.test(r.reason)),
  result.rejected.map((r) => r.reason),
);
check(
  "kept = read - rejected",
  result.stats.kept === 5 - result.rejected.length,
  [result.stats.kept, result.rejected.length],
);
check("clean excludes rejects", result.clean.length === result.stats.kept);

console.log("── numeric aggregation ──");
const nums = parseCsv("sku,qty,price\nA,2,10.50\nB,3,4.25\nC,1,100\n");
const agg = runPipeline(nums, {
  required: [],
  dedupeOn: [],
  trimWhitespace: true,
  dropEmptyRows: true,
});
const priceCol = agg.totals.find((t) => t.column === "price");
check(
  "price summed",
  priceCol !== undefined && Math.abs(priceCol.sum - 114.75) < 0.001,
  priceCol,
);
check(
  "qty summed",
  agg.totals.find((t) => t.column === "qty")?.sum === 6,
  agg.totals,
);
const idCsv = ["order_id,amount", "1001,5", "1002,7", "1003,9"].join("\n");
const idAgg = runPipeline(parseCsv(idCsv), {
  required: [],
  dedupeOn: [],
  trimWhitespace: true,
  dropEmptyRows: true,
});
check(
  "identifier column not aggregated",
  !idAgg.totals.some((t) => t.column === "order_id"),
  idAgg.totals.map((t) => t.column),
);
check(
  "real numeric column still aggregated",
  idAgg.totals.some((t) => t.column === "amount"),
  idAgg.totals.map((t) => t.column),
);

console.log("── round trip ──");
const rt = parseCsv(toCsv(parsed.headers, parsed.rows));
check(
  "round trip preserves cells",
  rt.rows[0][2] === parsed.rows[0][2],
  rt.rows[0][2],
);
check("round trip preserves newline cell", rt.rows[1][2] === parsed.rows[1][2]);

console.log("── extraction ──");
const doc = `ACME INDUSTRIAL SUPPLIES
Invoice No: INV-2026-0417
Date: 2026-02-11
Due: 2026-03-13
Bill To: Satchitanand Jigs And Fixtures
Contact: purchasing@demo-client.example

Bracket assembly rev C     6     125.00     750.00
Mounting plate             2      80.50     161.00
Fasteners pack            10       4.25      42.50

Subtotal: 953.50
VAT (5%): 47.68
Total: 1001.18`;
const ex = extract(doc);
const byKey = (k: string) => ex.fields.find((f) => f.key === k)?.value;
check("reference", byKey("reference") === "INV-2026-0417", byKey("reference"));
check("date", byKey("date") === "2026-02-11", byKey("date"));
check("due date", byKey("dueDate") === "2026-03-13", byKey("dueDate"));
check(
  "email",
  byKey("email") === "purchasing@demo-client.example",
  byKey("email"),
);
check(
  "total (not subtotal)",
  (byKey("total") ?? "").includes("1001.18"),
  byKey("total"),
);
check(
  "subtotal",
  (byKey("subtotal") ?? "").includes("953.50"),
  byKey("subtotal"),
);
check("3 line items", ex.lineItems.length === 3, ex.lineItems);
check(
  "line total computed",
  Math.abs(ex.lineTotal - 953.5) < 0.01,
  ex.lineTotal,
);
check("reconciles TRUE against subtotal", ex.reconciled === true, [
  ex.reconciled,
  ex.lineTotal,
  ex.statedTotal,
]);
check(
  "offsets valid",
  ex.fields.every((f) =>
    doc.slice(f.start, f.end).includes(f.value.slice(0, 6)),
  ),
  ex.fields.map((f) => [f.key, doc.slice(f.start, f.end)]),
);

console.log("── extraction: reference vs heading ──");
/**
 * Regression. The fixture above starts "ACME INDUSTRIAL SUPPLIES", which never
 * triggered the bug: the reference pattern is case-insensitive, so `[A-Z0-9]`
 * also matches lowercase, and `\s*` crosses newlines. A document whose heading
 * is the word INVOICE let the rule match the heading, run past the line break
 * and capture the plain word "Invoice" from the line below — at 95%
 * confidence. Requiring a digit in the captured token is what separates a
 * reference from an ordinary word.
 */
const headed = extract(
  "INVOICE\nInvoice Number: INV-2026-0042\nTotal: 100.00\n",
);
const headedRef = headed.fields.find((f) => f.key === "reference")?.value;
check(
  "heading does not shadow the reference",
  headedRef === "INV-2026-0042",
  headedRef,
);

const slashRef = extract(
  "QUOTATION\nQuote #: QT/2026/881\nTotal: 50.00\n",
).fields.find((f) => f.key === "reference")?.value;
check("slash-form reference", slashRef === "QT/2026/881", slashRef);

console.log("── extraction: missing reported ──");
const sparse = extract("just some prose with no fields at all");
check("missing listed", sparse.missing.length === 3, sparse.missing);
check("no invented fields", sparse.fields.length === 0, sparse.fields);

console.log("── quote ──");
const q = buildQuote(
  [
    { description: "Bracket assembly", quantity: "6", unitPrice: "125.00" },
    {
      description: "Mounting plate",
      quantity: "2",
      unitPrice: "80.50",
      discount: "10",
    },
    { description: "", quantity: "1", unitPrice: "5" },
    { description: "Bad qty", quantity: "abc", unitPrice: "5" },
    { description: "Negative", quantity: "1", unitPrice: "-5" },
    { description: "", quantity: "", unitPrice: "" },
  ],
  {
    currency: "AED",
    taxPercent: 5,
    reference: "QT-TEST",
    customer: "Demo",
    validDays: 30,
  },
  new Date("2026-02-11T00:00:00Z"),
);
check(
  "2 valid lines",
  q.lines.length === 2,
  q.lines.map((l) => l.description),
);
check("3 issues", q.issues.length === 3, q.issues);
check("blank row ignored", !q.issues.some((i) => i.index === 6), q.issues);
check("line 1 amount", q.lines[0].amount === 75000, q.lines[0].amount);
check(
  "discount applied",
  q.lines[1].amount === Math.round(8050 * 2 * 0.9),
  q.lines[1].amount,
);
check(
  "subtotal = sum of lines",
  q.subtotal === q.lines.reduce((s, l) => s + l.amount, 0),
  q.subtotal,
);
check("tax 5%", q.tax === Math.round(q.subtotal * 0.05), q.tax);
check("total = subtotal + tax", q.total === q.subtotal + q.tax, q.total);
check(
  "valid until +30d",
  q.validUntil.toISOString().startsWith("2026-03-13"),
  q.validUntil.toISOString(),
);

const rendered = renderQuote(q);
check("render has TOTAL", /TOTAL: AED/.test(rendered), rendered.slice(-200));
check(
  "render lists both lines",
  rendered.includes("Bracket assembly") && rendered.includes("Mounting plate"),
);

console.log("\n── float safety ──");
const cents = buildQuote(
  [
    { description: "a", quantity: "3", unitPrice: "0.10" },
    { description: "b", quantity: "3", unitPrice: "0.20" },
  ],
  {
    currency: "USD",
    taxPercent: 0,
    reference: "R",
    customer: "C",
    validDays: 1,
  },
);
check("0.10*3 + 0.20*3 = 0.90 exactly", cents.subtotal === 90, cents.subtotal);

console.log(`\npassed ${pass}, failed ${fail}`);
if (fail > 0) process.exit(1);
