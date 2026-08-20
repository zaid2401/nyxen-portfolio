"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { Upload, FileText, Check, Copy, Download, Eraser } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared chrome for the Lab tools.
 *
 * Every tool has the same shape — provide an input, run it, read the result —
 * so the layout is defined once here and the tools supply only their own
 * controls and output.
 */

export function ToolFrame({
  title,
  summary,
  does,
  children,
}: {
  title: string;
  summary: string;
  does: string;
  children: ReactNode;
}) {
  return (
    <div className="border-line bg-raised/40 corner-ticks relative border">
      <div className="border-line flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b p-5">
        <div className="min-w-0">
          <h3 className="font-mono text-[0.9375rem]">{title}</h3>
          <p className="text-muted mt-2 max-w-2xl text-[0.8125rem] leading-relaxed">
            {summary}
          </p>
          <p className="text-dim mt-1.5 text-[0.75rem] leading-relaxed">
            {does}
          </p>
        </div>
        {/* This badge is the opposite of the old SIMULATED one, and it has to
            keep being earned: it may only say this while the tool genuinely
            computes its output from the visitor's input. */}
        <span className="border-accent-line text-accent bg-accent/[0.06] shrink-0 border px-2 py-1 font-mono text-[0.5625rem] tracking-[0.14em] uppercase">
          Runs for real
        </span>
      </div>
      {children}
    </div>
  );
}

/** Section heading inside a tool panel. */
export function ToolSection({
  label,
  meta,
  children,
  className,
}: {
  label: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("border-line border-b p-5 last:border-b-0", className)}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="label-key">{label}</p>
        {meta}
      </div>
      {children}
    </section>
  );
}

/**
 * Paste / drop / upload input.
 *
 * The file is read with FileReader in the browser and never leaves the page —
 * stated on the control itself, because "drop your data here" on a stranger's
 * website deserves an explicit answer about where it goes.
 */
export function DataInput({
  value,
  onChange,
  onLoadSample,
  onClear,
  placeholder,
  accept = ".csv,.txt,.tsv",
  rows = 8,
  label,
}: {
  value: string;
  onChange: (next: string) => void;
  onLoadSample: () => void;
  /** Wipes the input and any result derived from it. */
  onClear: () => void;
  placeholder: string;
  accept?: string;
  rows?: number;
  label: string;
}) {
  const [dragging, setDragging] = useState(false);
  const [filename, setFilename] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = label.toLowerCase().replace(/\W+/g, "-");

  const readFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        onChange(String(reader.result ?? ""));
        setFilename(file.name);
      };
      reader.readAsText(file);
    },
    [onChange],
  );

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) readFile(file);
        }}
        className={cn(
          "relative border transition-colors",
          dragging
            ? "border-accent bg-accent/[0.06]"
            : "border-line bg-void/60",
        )}
      >
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <textarea
          id={id}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setFilename(null);
          }}
          rows={rows}
          spellCheck={false}
          placeholder={placeholder}
          className="placeholder:text-dim text-fg block w-full resize-y bg-transparent p-4 font-mono text-[0.75rem] leading-relaxed outline-none"
        />
        {dragging && (
          <div className="bg-void/80 pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="text-accent font-mono text-xs tracking-[0.14em] uppercase">
              Drop file to load
            </p>
          </div>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="border-line text-muted hover:border-accent-line hover:text-accent flex items-center gap-1.5 border px-2.5 py-1.5 font-mono text-[0.5625rem] tracking-[0.12em] uppercase transition-colors"
        >
          <Upload aria-hidden="true" className="h-2.5 w-2.5" />
          Upload file
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) readFile(file);
            e.target.value = "";
          }}
        />

        <button
          type="button"
          onClick={() => {
            onLoadSample();
            setFilename(null);
          }}
          className="border-line text-muted hover:border-accent-line hover:text-accent flex items-center gap-1.5 border px-2.5 py-1.5 font-mono text-[0.5625rem] tracking-[0.12em] uppercase transition-colors"
        >
          <FileText aria-hidden="true" className="h-2.5 w-2.5" />
          Load sample
        </button>

        <button
          type="button"
          onClick={() => {
            onClear();
            setFilename(null);
          }}
          disabled={value.length === 0}
          className="border-line text-muted hover:border-danger/50 hover:text-danger flex items-center gap-1.5 border px-2.5 py-1.5 font-mono text-[0.5625rem] tracking-[0.12em] uppercase transition-colors disabled:opacity-40 disabled:hover:border-[var(--color-line)] disabled:hover:text-[var(--color-muted)]"
        >
          <Eraser aria-hidden="true" className="h-2.5 w-2.5" />
          Clear
        </button>

        {filename && (
          <span className="text-accent flex items-center gap-1.5 font-mono text-[0.625rem]">
            <Check aria-hidden="true" className="h-3 w-3" />
            {filename}
          </span>
        )}

        <span className="text-dim/80 ml-auto font-mono text-[0.5625rem] leading-relaxed">
          Processed in your browser · never uploaded
        </span>
      </div>
    </div>
  );
}

/** Copy-to-clipboard / download pair for a generated text artefact. */
export function ResultActions({
  text,
  filename,
  mime = "text/plain",
}: {
  text: string;
  filename: string;
  mime?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          } catch {
            // Clipboard blocked (insecure origin, permissions) — the text is
            // on screen and selectable, so this is a convenience, not a path.
          }
        }}
        className="border-line text-muted hover:border-accent-line hover:text-accent flex items-center gap-1.5 border px-2.5 py-1.5 font-mono text-[0.5625rem] tracking-[0.12em] uppercase transition-colors"
      >
        {copied ? (
          <Check aria-hidden="true" className="h-2.5 w-2.5" />
        ) : (
          <Copy aria-hidden="true" className="h-2.5 w-2.5" />
        )}
        {copied ? "Copied" : "Copy"}
      </button>

      <button
        type="button"
        onClick={() => {
          const blob = new Blob([text], { type: `${mime};charset=utf-8` });
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = filename;
          anchor.click();
          // Revoke on the next tick — revoking synchronously can cancel the
          // download in some browsers before it has started reading.
          window.setTimeout(() => URL.revokeObjectURL(url), 0);
        }}
        className="border-line text-muted hover:border-accent-line hover:text-accent flex items-center gap-1.5 border px-2.5 py-1.5 font-mono text-[0.5625rem] tracking-[0.12em] uppercase transition-colors"
      >
        <Download aria-hidden="true" className="h-2.5 w-2.5" />
        Download
      </button>
    </div>
  );
}

/** Compact stat used across the tools. */
export function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "accent" | "warn" | "danger";
}) {
  return (
    <div className="border-line bg-void/40 border p-3">
      <p className="text-dim font-mono text-[0.5625rem] tracking-[0.12em] uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 font-mono text-base tabular-nums",
          tone === "accent" && "text-accent",
          tone === "warn" && "text-warn",
          tone === "danger" && "text-danger",
        )}
      >
        {value}
      </p>
    </div>
  );
}

/** Horizontally scrollable table shell — wide data must never widen the page. */
export function TableScroll({ children }: { children: ReactNode }) {
  return (
    <div className="border-line bg-void/40 overflow-x-auto border">
      {children}
    </div>
  );
}
