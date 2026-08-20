"use client";

import { useMemo, useState } from "react";
import { Play, AlertTriangle } from "lucide-react";
import {
  parseCsv,
  runPipeline,
  toCsv,
  type PipelineResult,
} from "@/lib/lab/csv";
import { SAMPLE_CSV } from "@/data/lab";
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
 * DATA PIPELINE — parse, infer, validate, deduplicate, aggregate.
 *
 * Everything on screen is computed from the text in the box. Change one cell
 * and the counts change; paste your own file and it processes that instead.
 *
 * Two deliberate UI decisions:
 *
 *  • Rejected rows are shown with the reason and the source line number, not
 *    just counted. A pipeline that silently drops 3% of your data is the
 *    failure mode this whole exercise is about.
 *  • The schema is presented as *inferred*, with the blank and invalid counts
 *    beside it, because inference is a guess and the reader should be able to
 *    see what it was guessing from.
 */
export function CsvPipeline() {
  const [text, setText] = useState("");
  const [required, setRequired] = useState<string[]>([]);
  const [dedupeOn, setDedupeOn] = useState<string[]>([]);
  const [ran, setRan] = useState(false);

  // Headers update live so the column toggles are usable before running.
  const headers = useMemo(() => {
    if (!text.trim()) return [];
    try {
      return parseCsv(text).headers;
    } catch {
      return [];
    }
  }, [text]);

  const result: PipelineResult | null = useMemo(() => {
    if (!ran || !text.trim()) return null;
    try {
      const parsed = parseCsv(text);
      if (parsed.headers.length === 0) return null;
      return runPipeline(parsed, {
        required: required.filter((r) => parsed.headers.includes(r)),
        dedupeOn: dedupeOn.filter((r) => parsed.headers.includes(r)),
        trimWhitespace: true,
        dropEmptyRows: true,
      });
    } catch {
      return null;
    }
  }, [ran, text, required, dedupeOn]);

  function toggle(list: string[], set: (v: string[]) => void, name: string) {
    set(list.includes(name) ? list.filter((n) => n !== name) : [...list, name]);
  }

  return (
    <>
      <ToolSection label="Input — CSV or TSV">
        <DataInput
          label="CSV data"
          value={text}
          onChange={(next) => {
            setText(next);
            setRan(false);
          }}
          onLoadSample={() => {
            setText(SAMPLE_CSV);
            setRequired(["customer"]);
            setDedupeOn(["order_id"]);
            setRan(false);
          }}
          onClear={() => {
            // Clear the rules too — they name columns that no longer exist,
            // and leaving them set makes the next paste behave oddly.
            setText("");
            setRequired([]);
            setDedupeOn([]);
            setRan(false);
          }}
          placeholder={
            "Paste CSV here, drop a file, or load the sample…\n\nid,name,amount\n1,Acme,120.50"
          }
        />
      </ToolSection>

      {headers.length > 0 && (
        <ToolSection
          label="Rules"
          meta={
            <span className="text-dim font-mono text-[0.5625rem] tracking-[0.1em] uppercase">
              {headers.length} columns detected
            </span>
          }
        >
          <div className="space-y-4">
            <Rule
              title="Required — reject rows where these are blank"
              headers={headers}
              selected={required}
              onToggle={(name) => {
                toggle(required, setRequired, name);
                setRan(false);
              }}
            />
            <Rule
              title="Deduplicate on — rows repeating this key are dropped"
              headers={headers}
              selected={dedupeOn}
              onToggle={(name) => {
                toggle(dedupeOn, setDedupeOn, name);
                setRan(false);
              }}
            />
          </div>
        </ToolSection>
      )}

      <ToolSection label="Run">
        <div className="flex flex-wrap items-center gap-3">
          <ActionButton
            variant="primary"
            onClick={() => setRan(true)}
            disabled={!text.trim()}
          >
            <Play aria-hidden="true" className="h-3 w-3" />
            Run pipeline
          </ActionButton>
          {!text.trim() && (
            <span className="text-dim font-mono text-[0.625rem]">
              Paste data or load the sample first.
            </span>
          )}
        </div>
      </ToolSection>

      {ran && !result && text.trim() && (
        <ToolSection label="Result">
          <p className="text-warn flex items-center gap-2 font-mono text-[0.75rem]">
            <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />
            That does not parse as delimited data. Check the header row.
          </p>
        </ToolSection>
      )}

      {result && (
        <>
          <ToolSection label="Result">
            <div className="grid grid-cols-2 gap-px sm:grid-cols-4">
              <Stat label="Rows read" value={String(result.stats.read)} />
              <Stat
                label="Rows kept"
                value={String(result.stats.kept)}
                tone="accent"
              />
              <Stat
                label="Rejected"
                value={String(result.rejected.length)}
                tone={result.rejected.length > 0 ? "warn" : "neutral"}
              />
              <Stat
                label="Duplicates"
                value={String(result.duplicates)}
                tone={result.duplicates > 0 ? "warn" : "neutral"}
              />
            </div>
            {(result.stats.trimmed > 0 || result.stats.ragged > 0) && (
              <p className="text-dim mt-3 font-mono text-[0.625rem] leading-relaxed">
                {result.stats.trimmed > 0 &&
                  `${result.stats.trimmed} row${result.stats.trimmed === 1 ? "" : "s"} had whitespace trimmed. `}
                {result.stats.ragged > 0 &&
                  `${result.stats.ragged} row${result.stats.ragged === 1 ? "" : "s"} had a column count mismatch and were padded.`}
              </p>
            )}
          </ToolSection>

          <ToolSection label="Inferred schema">
            <TableScroll>
              <table className="w-full min-w-max border-collapse font-mono text-[0.6875rem]">
                <thead>
                  <tr className="border-line text-dim border-b text-left">
                    <Th>Column</Th>
                    <Th>Inferred type</Th>
                    <Th className="text-right">Blank</Th>
                    <Th className="text-right">Invalid</Th>
                  </tr>
                </thead>
                <tbody>
                  {result.schema.map((column) => (
                    <tr
                      key={column.name}
                      className="border-line/60 border-b last:border-b-0"
                    >
                      <Td className="text-fg">{column.name}</Td>
                      <Td>
                        <span
                          className={cn(
                            column.type === "text"
                              ? "text-muted"
                              : "text-accent",
                          )}
                        >
                          {column.type}
                        </span>
                      </Td>
                      <Td className="text-right tabular-nums">
                        {column.blanks || "—"}
                      </Td>
                      <Td className="text-right tabular-nums">
                        {column.invalid || "—"}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          </ToolSection>

          {result.rejected.length > 0 && (
            <ToolSection
              label="Rejected rows"
              meta={
                <span className="text-warn font-mono text-[0.5625rem] tracking-[0.1em] uppercase">
                  shown, not silently dropped
                </span>
              }
            >
              <ul className="space-y-px">
                {result.rejected.slice(0, 12).map((rejection) => (
                  <li
                    key={`${rejection.line}-${rejection.reason}`}
                    className="border-warn/25 bg-warn/[0.04] flex flex-wrap items-baseline gap-x-3 gap-y-1 border p-3 font-mono text-[0.6875rem]"
                  >
                    <span className="text-dim shrink-0">
                      line {rejection.line}
                    </span>
                    <span className="text-warn min-w-0">
                      {rejection.reason}
                    </span>
                    <span className="text-dim/70 w-full truncate">
                      {rejection.row.join(" · ")}
                    </span>
                  </li>
                ))}
                {result.rejected.length > 12 && (
                  <li className="text-dim px-3 pt-2 font-mono text-[0.625rem]">
                    + {result.rejected.length - 12} more
                  </li>
                )}
              </ul>
            </ToolSection>
          )}

          {result.totals.length > 0 && (
            <ToolSection label="Aggregates — computed from the kept rows">
              <TableScroll>
                <table className="w-full min-w-max border-collapse font-mono text-[0.6875rem]">
                  <thead>
                    <tr className="border-line text-dim border-b text-left">
                      <Th>Column</Th>
                      <Th className="text-right">Sum</Th>
                      <Th className="text-right">Mean</Th>
                      <Th className="text-right">Min</Th>
                      <Th className="text-right">Max</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.totals.map((total) => (
                      <tr
                        key={total.column}
                        className="border-line/60 border-b last:border-b-0"
                      >
                        <Td className="text-fg">{total.column}</Td>
                        <Td className="text-accent text-right tabular-nums">
                          {round(total.sum)}
                        </Td>
                        <Td className="text-right tabular-nums">
                          {round(total.mean)}
                        </Td>
                        <Td className="text-right tabular-nums">
                          {round(total.min)}
                        </Td>
                        <Td className="text-right tabular-nums">
                          {round(total.max)}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
            </ToolSection>
          )}

          <ToolSection
            label="Clean output"
            meta={
              <ResultActions
                text={toCsv(result.headers, result.clean)}
                filename="cleaned.csv"
                mime="text/csv"
              />
            }
          >
            <TableScroll>
              <table className="w-full min-w-max border-collapse font-mono text-[0.6875rem]">
                <thead>
                  <tr className="border-line text-dim border-b text-left">
                    {result.headers.map((header) => (
                      <Th key={header}>{header}</Th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.clean.slice(0, 10).map((row, index) => (
                    <tr
                      key={index}
                      className="border-line/60 border-b last:border-b-0"
                    >
                      {row.map((cell, cellIndex) => (
                        <Td key={cellIndex} className="text-muted">
                          <span className="block max-w-[16rem] truncate">
                            {cell || "—"}
                          </span>
                        </Td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
            {result.clean.length > 10 && (
              <p className="text-dim mt-2.5 font-mono text-[0.625rem]">
                Showing 10 of {result.clean.length} kept rows — download for the
                full set.
              </p>
            )}
          </ToolSection>
        </>
      )}
    </>
  );
}

function round(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "px-3 py-2 font-normal tracking-[0.1em] uppercase",
        className,
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={cn("px-3 py-2 align-top", className)}>{children}</td>;
}

function Rule({
  title,
  headers,
  selected,
  onToggle,
}: {
  title: string;
  headers: string[];
  selected: string[];
  onToggle: (name: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-dim mb-2 font-mono text-[0.625rem] leading-relaxed">
        {title}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {headers.map((header) => {
          const on = selected.includes(header);
          return (
            <button
              key={header}
              type="button"
              onClick={() => onToggle(header)}
              aria-pressed={on}
              className={cn(
                "border px-2 py-1 font-mono text-[0.625rem] transition-colors",
                on
                  ? "border-accent-line bg-accent/[0.08] text-accent"
                  : "border-line text-dim hover:border-line-strong hover:text-muted",
              )}
            >
              {header}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
