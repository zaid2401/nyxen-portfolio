/**
 * ─────────────────────────────────────────────────────────────────────────────
 * NYXEN LAB — SAMPLE INPUTS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The Lab tools do real work on whatever they are given. This file only holds
 * the starter inputs offered by the "Load sample" buttons, so a visitor who
 * does not want to type anything still sees the tools run.
 *
 * The samples are deliberately dirty. A clean CSV proves nothing — the point of
 * the pipeline is what it does with a duplicate row, a missing key, a number
 * that is really the string "n/a", and a quoted field containing a comma. Every
 * defect below is one that exists in real exported data.
 *
 * All values are invented. No customer, document or system here is real.
 */

export interface LabTool {
  id: string;
  name: string;
  /** One line under the title. */
  summary: string;
  /** What the tool genuinely does, stated plainly. */
  does: string;
}

export const labTools: LabTool[] = [
  {
    id: "pipeline",
    name: "Data Pipeline",
    summary:
      "Parse a CSV, infer its schema, validate every row, drop duplicates and aggregate what survives.",
    does: "Runs entirely in your browser on the file you provide. Nothing is uploaded.",
  },
  {
    id: "extract",
    name: "Document → Data",
    summary:
      "Pull structured fields and line items out of unstructured document text, then reconcile the arithmetic.",
    does: "Real rule-based extraction. Every result shows the rule that found it.",
  },
  {
    id: "quote",
    name: "Quotation Builder",
    summary:
      "The last step of case file #001: validate line items, price them, and generate the document.",
    does: "Real validation and real money arithmetic, in integer minor units.",
  },
];

/* ── Sample CSV ─────────────────────────────────────────────────────────────
 * Contains, on purpose: a quoted comma, an escaped quote, a newline inside a
 * quoted field, a duplicate order id, a blank required field, a non-numeric
 * value in an otherwise numeric column, and untrimmed whitespace.
 */
export const SAMPLE_CSV = `order_id,customer,item,quantity,unit_price,ordered_on,notes
1001,Acme Ltd,Bracket assembly,6,125.00,2026-01-14,"said ""urgent"", call first"
1002,Beta Works,Mounting plate,2,80.50,2026-01-15,standard
1003,  Gamma Co  ,Fasteners pack,10,4.25,2026-01-16,"multi
line note"
1002,Beta Works,Mounting plate,2,80.50,2026-01-15,duplicate row
1004,,Spacer set,4,12.00,2026-01-17,missing customer
1005,Delta Inc,Guide rail,n/a,45.00,2026-01-18,quantity not a number
1006,Epsilon,Clamp,3,18.75,2026-01-19,fine
1007,Acme Ltd,Bracket assembly,1,125.00,2026-01-20,fine`;

/* ── Sample document text ───────────────────────────────────────────────────
 * Shaped the way a PDF looks once its layout has been flattened to text, which
 * is what the extraction rules actually have to cope with.
 */
export const SAMPLE_DOCUMENT = `ACME INDUSTRIAL SUPPLIES FZE
Plot 42, Industrial Area 3

Invoice No: INV-2026-0417
Date: 2026-02-11
Due: 2026-03-13

Bill To: Satchitanand Jigs And Fixtures
Contact: purchasing@demo-client.example

Description                 Qty      Unit      Amount
Bracket assembly rev C        6    125.00      750.00
Mounting plate                2     80.50      161.00
Fasteners pack               10      4.25       42.50

Subtotal: 953.50
VAT (5%): 47.68
Total: 1001.18

Payment within 30 days.`;

/* ── Sample quotation lines ─────────────────────────────────────────────── */
export const SAMPLE_QUOTE_LINES = [
  {
    description: "Bracket assembly rev C",
    quantity: "6",
    unitPrice: "125.00",
    discount: "",
  },
  {
    description: "Mounting plate",
    quantity: "2",
    unitPrice: "80.50",
    discount: "10",
  },
  {
    description: "Fasteners pack",
    quantity: "10",
    unitPrice: "4.25",
    discount: "",
  },
];
