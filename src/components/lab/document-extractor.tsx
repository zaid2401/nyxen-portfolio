"use client";

import { useMemo, useState } from "react";
import { Play, Check, X, AlertTriangle } from "lucide-react";
import { extract, type ExtractionResult } from "@/lib/lab/extract";
import { SAMPLE_DOCUMENT } from "@/data/lab";
import { ActionButton } from "@/components/ui/action";
import {
  DataInput,
  ResultActions,
  Stat,
  TableScroll,
  ToolSection,
} from "@/components/lab/lab-shell";
import { cn } from "@/lib/utils";

/**
 * DOCUMENT → DATA.
 *
 * Real rule-based extraction over whatever text is pasted in. The design point
 * being demonstrated is not the regexes — it is that every extracted value
 * carries the rule that produced it and a confidence, and that fields the rules
 * looked for and did not find are reported rather than quietly omitted.
 *
 * An extractor that returns four fields out of five and says nothing about the
 * fifth is how bad data gets into a system unnoticed.
 */
export function DocumentExtractor() {
  const [text, setText] = useState("");
  const [ran, setRan] = useState(false);

  const result: ExtractionResult | null = useMemo(() => {
    if (!ran || !text.trim()) return null;
    return extract(text);
  }, [ran, text]);

  const json = useMemo(() => {
    if (!result) return "";
    return JSON.stringify(
      {
        fields: Object.fromEntries(result.fields.map((f) => [f.key, f.value])),
        lineItems: result.lineItems.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          amount: i.amount,
        })),
        lineTotal: Number(result.lineTotal.toFixed(2)),
        statedTotal: result.statedTotal,
        reconciled: result.reconciled,
        missing: result.missing,
      },
      null,
      2,
    );
  }, [result]);

  return (
    <>
      <ToolSection label="Input — document text">
        <DataInput
          label="Document text"
          value={text}
          onChange={(next) => {
            setText(next);
            setRan(false);
          }}
          onLoadSample={() => {
            setText(SAMPLE_DOCUMENT);
            setRan(false);
          }}
          onClear={() => {
            setText("");
            setRan(false);
          }}
          accept=".txt,.text,.md,.csv"
          rows={10}
          placeholder={
            "Paste the text of an invoice, quotation or RFQ…\n\nThis is the shape a PDF takes once its layout is flattened to text."
          }
        />
        <p className="text-dim/80 mt-2.5 text-[0.625rem] leading-relaxed">
          Text only. PDF parsing needs a renderer this page deliberately does
          not ship — in the real pipeline that step runs server-side, and the
          extraction below is what happens immediately after it.
        </p>
      </ToolSection>

      <ToolSection label="Run">
        <div className="flex flex-wrap items-center gap-3">
          <ActionButton
            variant="primary"
            onClick={() => setRan(true)}
            disabled={!text.trim()}
          >
            <Play aria-hidden="true" className="h-3 w-3" />
            Extract fields
          </ActionButton>
          {!text.trim() && (
            <span className="text-dim font-mono text-[0.625rem]">
              Paste a document or load the sample first.
            </span>
          )}
        </div>
      </ToolSection>

      {result && (
        <>
          <ToolSection label="Extracted fields">
            {result.fields.length > 0 ? (
              <ul className="space-y-px">
                {result.fields.map((field) => (
                  <li
                    key={field.key}
                    className="border-line bg-void/40 flex flex-wrap items-baseline gap-x-3 gap-y-1 border p-3"
                  >
                    <span className="text-dim w-32 shrink-0 font-mono text-[0.5625rem] tracking-[0.12em] uppercase">
                      {field.label}
                    </span>
                    <span className="text-accent min-w-0 flex-1 font-mono text-[0.8125rem] break-words">
                      {field.value}
                    </span>
                    <span className="text-dim/80 shrink-0 font-mono text-[0.5625rem]">
                      {field.rule} · {Math.round(field.confidence * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-dim font-mono text-[0.75rem]">
                No fields matched. The rules look for a reference, a date, a
                total, an email and party lines.
              </p>
            )}

            {result.missing.length > 0 && (
              <p className="border-warn/30 bg-warn/[0.04] text-warn mt-3 flex items-start gap-2 border p-3 font-mono text-[0.6875rem] leading-relaxed">
                <AlertTriangle
                  aria-hidden="true"
                  className="mt-px h-3 w-3 shrink-0"
                />
                <span>
                  Not found: {result.missing.join(", ")}. Reported rather than
                  guessed — a missing field is a fact about the document.
                </span>
              </p>
            )}
          </ToolSection>

          {result.lineItems.length > 0 && (
            <ToolSection label="Line items">
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
                        Stated
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-right font-normal tracking-[0.1em] uppercase"
                      >
                        Recomputed
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.lineItems.map((item, index) => {
                      const recomputed = item.quantity * item.unitPrice;
                      const agrees = Math.abs(recomputed - item.amount) < 0.02;
                      return (
                        <tr
                          key={index}
                          className="border-line/60 border-b last:border-b-0"
                        >
                          <td className="text-fg px-3 py-2">
                            {item.description}
                          </td>
                          <td className="text-muted px-3 py-2 text-right tabular-nums">
                            {item.quantity}
                          </td>
                          <td className="text-muted px-3 py-2 text-right tabular-nums">
                            {item.unitPrice.toFixed(2)}
                          </td>
                          <td className="text-muted px-3 py-2 text-right tabular-nums">
                            {item.amount.toFixed(2)}
                          </td>
                          <td
                            className={cn(
                              "px-3 py-2 text-right tabular-nums",
                              agrees ? "text-accent" : "text-danger",
                            )}
                          >
                            {recomputed.toFixed(2)}
                            {!agrees && " ✗"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </TableScroll>
              <p className="text-dim mt-2.5 font-mono text-[0.625rem] leading-relaxed">
                Every line amount is recomputed from quantity × unit price
                rather than trusted. A mismatch is shown, not corrected.
              </p>
            </ToolSection>
          )}

          <ToolSection label="Reconciliation">
            <div className="grid grid-cols-2 gap-px sm:grid-cols-3">
              <Stat
                label="Line items"
                value={String(result.lineItems.length)}
              />
              <Stat
                label="Sum of lines"
                value={result.lineTotal.toFixed(2)}
                tone="accent"
              />
              <Stat
                label="Stated total"
                value={
                  result.statedTotal === null
                    ? "—"
                    : result.statedTotal.toFixed(2)
                }
              />
            </div>

            {result.reconciled !== null && (
              <p
                className={cn(
                  "mt-3 flex items-start gap-2 border p-3 font-mono text-[0.6875rem] leading-relaxed",
                  result.reconciled
                    ? "border-accent-line/40 bg-accent/[0.04] text-accent"
                    : "border-danger/30 bg-danger/[0.04] text-danger",
                )}
              >
                {result.reconciled ? (
                  <Check
                    aria-hidden="true"
                    className="mt-px h-3 w-3 shrink-0"
                  />
                ) : (
                  <X aria-hidden="true" className="mt-px h-3 w-3 shrink-0" />
                )}
                <span>
                  {result.reconciled
                    ? "Line items reconcile against the document's own subtotal. Safe to load."
                    : "Line items do not reconcile. In a real pipeline this document stops here and goes to a human."}
                </span>
              </p>
            )}
          </ToolSection>

          <ToolSection
            label="Structured output"
            meta={
              <ResultActions
                text={json}
                filename="extracted.json"
                mime="application/json"
              />
            }
          >
            <pre className="border-line bg-void/60 overflow-x-auto border p-4 font-mono text-[0.6875rem] leading-relaxed">
              {json}
            </pre>
          </ToolSection>
        </>
      )}
    </>
  );
}
