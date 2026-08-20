"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, RotateCcw, AlertTriangle, Eraser } from "lucide-react";
import {
  buildQuote,
  formatMinor,
  renderQuote,
  type QuoteInput,
} from "@/lib/lab/quote";
import { SAMPLE_QUOTE_LINES } from "@/data/lab";
import {
  ResultActions,
  Stat,
  TableScroll,
  ToolSection,
} from "@/components/lab/lab-shell";
import { cn } from "@/lib/utils";

/**
 * QUOTATION BUILDER — the last step of case file #001, done for real.
 *
 * Edit a line and every figure below updates, because they are computed rather
 * than staged. Money is handled in integer minor units end to end, so the
 * column visibly adds up to the subtotal and the tax is exact.
 *
 * The behaviour worth watching is what happens to a bad row: validation runs to
 * completion first and the offending line is listed with its reason, while the
 * valid lines still price. That is the same decision the real automation makes
 * — fail the row, not the document, and never half-write.
 */

const BLANK: QuoteInput = {
  description: "",
  quantity: "",
  unitPrice: "",
  discount: "",
};

export function QuoteBuilder() {
  const [lines, setLines] = useState<QuoteInput[]>([{ ...BLANK }]);
  const [reference, setReference] = useState("QT-2026-0001");
  const [customer, setCustomer] = useState("");
  const [currency, setCurrency] = useState("AED");
  const [taxPercent, setTaxPercent] = useState("5");

  const quote = useMemo(
    () =>
      buildQuote(lines, {
        currency: currency.trim().toUpperCase() || "AED",
        taxPercent: Number(taxPercent) || 0,
        reference: reference.trim() || "QT-DRAFT",
        customer: customer.trim(),
        validDays: 30,
      }),
    [lines, currency, taxPercent, reference, customer],
  );

  const document = useMemo(() => renderQuote(quote), [quote]);

  function update(index: number, patch: Partial<QuoteInput>) {
    setLines((current) =>
      current.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    );
  }

  function issuesFor(index: number) {
    return quote.issues.filter((issue) => issue.index === index + 1);
  }

  return (
    <>
      <ToolSection label="Quotation details">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Reference" value={reference} onChange={setReference} />
          <Field
            label="Customer"
            value={customer}
            onChange={setCustomer}
            placeholder="Optional"
          />
          <Field
            label="Currency"
            value={currency}
            onChange={setCurrency}
            width="short"
          />
          <Field
            label="Tax %"
            value={taxPercent}
            onChange={setTaxPercent}
            width="short"
            inputMode="decimal"
          />
        </div>
      </ToolSection>

      <ToolSection
        label="Line items"
        meta={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setLines(SAMPLE_QUOTE_LINES.map((line) => ({ ...line })))
              }
              className="border-line text-muted hover:border-accent-line hover:text-accent flex items-center gap-1.5 border px-2.5 py-1.5 font-mono text-[0.5625rem] tracking-[0.12em] uppercase transition-colors"
            >
              <RotateCcw aria-hidden="true" className="h-2.5 w-2.5" />
              Load sample
            </button>
            <button
              type="button"
              onClick={() => setLines((c) => [...c, { ...BLANK }])}
              className="border-line text-muted hover:border-accent-line hover:text-accent flex items-center gap-1.5 border px-2.5 py-1.5 font-mono text-[0.5625rem] tracking-[0.12em] uppercase transition-colors"
            >
              <Plus aria-hidden="true" className="h-2.5 w-2.5" />
              Add line
            </button>
            <button
              type="button"
              onClick={() => {
                setLines([{ ...BLANK }]);
                setCustomer("");
              }}
              className="border-line text-muted hover:border-danger/50 hover:text-danger flex items-center gap-1.5 border px-2.5 py-1.5 font-mono text-[0.5625rem] tracking-[0.12em] uppercase transition-colors"
            >
              <Eraser aria-hidden="true" className="h-2.5 w-2.5" />
              Clear all
            </button>
          </div>
        }
      >
        <ul className="space-y-2">
          {lines.map((line, index) => {
            const issues = issuesFor(index);
            return (
              <li
                key={index}
                className={cn(
                  "border p-3",
                  issues.length > 0
                    ? "border-danger/40 bg-danger/[0.03]"
                    : "border-line bg-void/40",
                )}
              >
                <div className="grid gap-2 sm:grid-cols-[1fr_5rem_7rem_5rem_2rem]">
                  <LineField
                    label="Description"
                    value={line.description}
                    onChange={(v) => update(index, { description: v })}
                    invalid={issues.some((i) => i.field === "description")}
                  />
                  <LineField
                    label="Qty"
                    value={line.quantity}
                    onChange={(v) => update(index, { quantity: v })}
                    invalid={issues.some((i) => i.field === "quantity")}
                    inputMode="decimal"
                  />
                  <LineField
                    label="Unit price"
                    value={line.unitPrice}
                    onChange={(v) => update(index, { unitPrice: v })}
                    invalid={issues.some((i) => i.field === "unitPrice")}
                    inputMode="decimal"
                  />
                  <LineField
                    label="Disc %"
                    value={line.discount ?? ""}
                    onChange={(v) => update(index, { discount: v })}
                    invalid={issues.some((i) => i.field === "discount")}
                    inputMode="decimal"
                  />
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() =>
                        setLines((c) =>
                          c.length === 1
                            ? [{ ...BLANK }]
                            : c.filter((_, i) => i !== index),
                        )
                      }
                      aria-label={`Remove line ${index + 1}`}
                      className="text-dim hover:text-danger border-line hover:border-danger/50 w-full border p-2 transition-colors sm:w-auto"
                    >
                      <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {issues.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {issues.map((issue) => (
                      <li
                        key={issue.field}
                        className="text-danger flex items-center gap-1.5 font-mono text-[0.625rem]"
                      >
                        <AlertTriangle
                          aria-hidden="true"
                          className="h-2.5 w-2.5 shrink-0"
                        />
                        {issue.message}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>

        {quote.issues.length > 0 && (
          <p className="text-dim mt-3 font-mono text-[0.625rem] leading-relaxed">
            {quote.issues.length} validation{" "}
            {quote.issues.length === 1 ? "issue" : "issues"} — those lines are
            excluded from the totals below, and the rest still price. Validation
            completes before anything is priced, so there is never a partial
            document to unwind.
          </p>
        )}
      </ToolSection>

      <ToolSection label="Priced lines">
        {quote.lines.length > 0 ? (
          <>
            <TableScroll>
              <table className="w-full min-w-max border-collapse font-mono text-[0.6875rem]">
                <thead>
                  <tr className="border-line text-dim border-b text-left">
                    <th
                      scope="col"
                      className="px-3 py-2 font-normal tracking-[0.1em] uppercase"
                    >
                      Description
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-right font-normal tracking-[0.1em] uppercase"
                    >
                      Qty
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-right font-normal tracking-[0.1em] uppercase"
                    >
                      Unit
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-right font-normal tracking-[0.1em] uppercase"
                    >
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {quote.lines.map((line) => (
                    <tr
                      key={line.index}
                      className="border-line/60 border-b last:border-b-0"
                    >
                      <td className="text-fg px-3 py-2">
                        {line.description}
                        {line.discountPercent > 0 && (
                          <span className="text-iris ml-2">
                            −{line.discountPercent}%
                          </span>
                        )}
                      </td>
                      <td className="text-muted px-3 py-2 text-right tabular-nums">
                        {line.quantity}
                      </td>
                      <td className="text-muted px-3 py-2 text-right tabular-nums">
                        {formatMinor(line.unitPrice, quote.settings.currency)}
                      </td>
                      <td className="text-accent px-3 py-2 text-right tabular-nums">
                        {formatMinor(line.amount, quote.settings.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>

            <div className="mt-3 grid grid-cols-3 gap-px">
              <Stat
                label="Subtotal"
                value={formatMinor(quote.subtotal, quote.settings.currency)}
              />
              <Stat
                label={`Tax ${quote.settings.taxPercent}%`}
                value={formatMinor(quote.tax, quote.settings.currency)}
              />
              <Stat
                label="Total"
                value={formatMinor(quote.total, quote.settings.currency)}
                tone="accent"
              />
            </div>
          </>
        ) : (
          <p className="text-dim font-mono text-[0.75rem]">
            No valid lines yet. Add one, or load the sample.
          </p>
        )}
      </ToolSection>

      {quote.lines.length > 0 && (
        <ToolSection
          label="Generated quotation"
          meta={
            <ResultActions
              text={document}
              filename={`${quote.settings.reference || "quotation"}.txt`}
            />
          }
        >
          <pre className="border-line bg-void/60 overflow-x-auto border p-4 font-mono text-[0.6875rem] leading-relaxed">
            {document}
          </pre>
        </ToolSection>
      )}
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  width,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  width?: "short";
  inputMode?: "decimal";
}) {
  const id = `quote-${label.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <div className={cn(width === "short" && "sm:max-w-[10rem]")}>
      <label
        htmlFor={id}
        className="text-dim block font-mono text-[0.5625rem] tracking-[0.12em] uppercase"
      >
        {label}
      </label>
      <input
        id={id}
        value={value}
        inputMode={inputMode}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="border-line bg-void/60 text-fg placeholder:text-dim focus:border-accent-line mt-1.5 w-full border px-3 py-2 font-mono text-[0.75rem] transition-colors outline-none"
      />
    </div>
  );
}

function LineField({
  label,
  value,
  onChange,
  invalid,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  invalid: boolean;
  inputMode?: "decimal";
}) {
  return (
    <label className="block">
      <span className="text-dim block font-mono text-[0.5625rem] tracking-[0.12em] uppercase sm:sr-only">
        {label}
      </span>
      <input
        value={value}
        inputMode={inputMode}
        aria-label={label}
        aria-invalid={invalid || undefined}
        placeholder={label}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "bg-void/60 text-fg placeholder:text-dim mt-1 w-full border px-2.5 py-2 font-mono text-[0.75rem] transition-colors outline-none sm:mt-0",
          invalid ? "border-danger/60" : "border-line focus:border-accent-line",
        )}
      />
    </label>
  );
}
