/**
 * ─────────────────────────────────────────────────────────────────────────────
 * QUOTATION GENERATION
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The last step of the quotation case file, done for real: take line items,
 * validate them, price them, and emit a document.
 *
 * The design point worth noticing is that validation is a separate pass that
 * runs to completion before anything is priced. That is the same decision the
 * real automation makes, and for the same reason — a bad row should fail while
 * it is still just a row, not halfway through writing a document.
 *
 * Money is handled in integer minor units (cents/fils) throughout. Summing
 * floats is how a quotation ends up off by a cent, and a quotation that does
 * not add up is worse than no quotation.
 *
 * Pure — no DOM, no network, no company system.
 */

export interface QuoteInput {
  description: string;
  quantity: string;
  unitPrice: string;
  /** Percentage, e.g. "10" for 10% off this line. Optional. */
  discount?: string;
}

export interface QuoteLine {
  index: number;
  description: string;
  quantity: number;
  /** Minor units. */
  unitPrice: number;
  discountPercent: number;
  /** Minor units, after discount, rounded once. */
  amount: number;
}

export interface QuoteIssue {
  index: number;
  field: "description" | "quantity" | "unitPrice" | "discount";
  message: string;
}

export interface QuoteSettings {
  currency: string;
  /** Percentage, e.g. 5 for 5% VAT. */
  taxPercent: number;
  reference: string;
  customer: string;
  validDays: number;
}

export interface Quote {
  lines: QuoteLine[];
  issues: QuoteIssue[];
  subtotal: number;
  tax: number;
  total: number;
  settings: QuoteSettings;
  /** Set once, so the document and the filename agree. */
  issuedAt: Date;
  validUntil: Date;
}

/** Parses a money string to integer minor units. Returns NaN when unusable. */
export function toMinor(value: string): number {
  const cleaned = value.trim().replace(/[^\d.-]/g, "");
  if (cleaned === "" || cleaned === "-") return Number.NaN;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return Number.NaN;
  return Math.round(n * 100);
}

export function formatMinor(minor: number, currency: string): string {
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(minor);
  const whole = Math.floor(abs / 100).toLocaleString("en-US");
  const cents = String(abs % 100).padStart(2, "0");
  return `${sign}${currency} ${whole}.${cents}`;
}

/**
 * Validates every row before pricing any of them, and returns both the priced
 * lines and the complete issue list. Callers decide what to do with a partial
 * result — the Lab shows the rejected rows rather than hiding them, which is
 * the whole point of the exercise.
 */
export function buildQuote(
  inputs: QuoteInput[],
  settings: QuoteSettings,
  now: Date = new Date(),
): Quote {
  const issues: QuoteIssue[] = [];
  const lines: QuoteLine[] = [];

  inputs.forEach((input, i) => {
    const index = i + 1;
    const description = input.description.trim();
    const rowIsBlank =
      description === "" &&
      input.quantity.trim() === "" &&
      input.unitPrice.trim() === "";
    if (rowIsBlank) return;

    let ok = true;

    if (description === "") {
      issues.push({
        index,
        field: "description",
        message: "Description is required",
      });
      ok = false;
    }

    const quantity = Number(input.quantity.trim().replace(/,/g, ""));
    if (!Number.isFinite(quantity)) {
      issues.push({
        index,
        field: "quantity",
        message: "Quantity is not a number",
      });
      ok = false;
    } else if (quantity <= 0) {
      issues.push({
        index,
        field: "quantity",
        message: "Quantity must be greater than zero",
      });
      ok = false;
    }

    const unitPrice = toMinor(input.unitPrice);
    if (Number.isNaN(unitPrice)) {
      issues.push({
        index,
        field: "unitPrice",
        message: "Unit price is not a number",
      });
      ok = false;
    } else if (unitPrice < 0) {
      issues.push({
        index,
        field: "unitPrice",
        message: "Unit price cannot be negative",
      });
      ok = false;
    }

    const discountRaw = (input.discount ?? "").trim();
    let discountPercent = 0;
    if (discountRaw !== "") {
      discountPercent = Number(discountRaw.replace(/%/g, ""));
      if (!Number.isFinite(discountPercent)) {
        issues.push({
          index,
          field: "discount",
          message: "Discount is not a number",
        });
        ok = false;
      } else if (discountPercent < 0 || discountPercent > 100) {
        issues.push({
          index,
          field: "discount",
          message: "Discount must be between 0 and 100",
        });
        ok = false;
      }
    }

    if (!ok) return;

    // Round once, at the line, so the column visibly adds up to the subtotal.
    const gross = unitPrice * quantity;
    const amount = Math.round(gross * (1 - discountPercent / 100));

    lines.push({
      index,
      description,
      quantity,
      unitPrice,
      discountPercent,
      amount,
    });
  });

  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const tax = Math.round(subtotal * (settings.taxPercent / 100));
  const total = subtotal + tax;

  const validUntil = new Date(now);
  validUntil.setDate(validUntil.getDate() + settings.validDays);

  return {
    lines,
    issues,
    subtotal,
    tax,
    total,
    settings,
    issuedAt: now,
    validUntil,
  };
}

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** Renders the quotation as plain text — a real artefact the visitor can keep. */
export function renderQuote(quote: Quote): string {
  const { settings } = quote;
  const currency = settings.currency;
  const pad = (s: string, n: number) => s.padEnd(n).slice(0, n);
  const padStart = (s: string, n: number) => s.padStart(n);

  const out: string[] = [];
  out.push("QUOTATION");
  out.push("=".repeat(64));
  out.push(`Reference   : ${settings.reference}`);
  out.push(`Customer    : ${settings.customer || "—"}`);
  out.push(`Issued      : ${DATE_FMT.format(quote.issuedAt)}`);
  out.push(`Valid until : ${DATE_FMT.format(quote.validUntil)}`);
  out.push("");
  out.push(
    `${pad("#", 4)}${pad("Description", 28)}${padStart("Qty", 6)}${padStart("Unit", 12)}${padStart("Amount", 14)}`,
  );
  out.push("-".repeat(64));

  for (const line of quote.lines) {
    const label =
      line.discountPercent > 0
        ? `${line.description} (-${line.discountPercent}%)`
        : line.description;
    out.push(
      pad(String(line.index), 4) +
        pad(label, 28) +
        padStart(String(line.quantity), 6) +
        padStart(formatMinor(line.unitPrice, currency), 12) +
        padStart(formatMinor(line.amount, currency), 14),
    );
  }

  out.push("-".repeat(64));
  out.push(padStart(`Subtotal: ${formatMinor(quote.subtotal, currency)}`, 64));
  out.push(
    padStart(
      `Tax (${settings.taxPercent}%): ${formatMinor(quote.tax, currency)}`,
      64,
    ),
  );
  out.push(padStart(`TOTAL: ${formatMinor(quote.total, currency)}`, 64));
  out.push("");
  out.push(
    "Generated in-browser by the NYXEN Lab. Demonstration only — not a commercial offer.",
  );

  return out.join("\n");
}
