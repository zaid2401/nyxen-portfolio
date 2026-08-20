"use client";

import { useState } from "react";
import { Section } from "@/components/ui/section";
import { labTools } from "@/data/lab";
import { ToolFrame } from "@/components/lab/lab-shell";
import { CsvPipeline } from "@/components/lab/csv-pipeline";
import { DocumentExtractor } from "@/components/lab/document-extractor";
import { QuoteBuilder } from "@/components/lab/quote-builder";
import { cn } from "@/lib/utils";

/**
 * NYXEN LAB.
 *
 * Three working tools, not three animations. Each one runs real logic on input
 * the visitor supplies: a CSV parser and validation pipeline, a rule-based
 * document field extractor, and a quotation generator.
 *
 * The logic lives in `src/lib/lab/` as pure functions with no DOM and no
 * network, which is what makes it both testable and safe to run on whatever
 * someone pastes in. Nothing is uploaded anywhere.
 *
 * One tool is mounted at a time, so only the active tool's state exists.
 */
export function Lab() {
  const [active, setActive] = useState(labTools[0].id);
  const tool = labTools.find((t) => t.id === active) ?? labTools[0];

  return (
    <Section
      id="lab"
      index="05"
      title="Lab"
      kicker="Working tools, not demos. Paste your own data — parsing, validation and arithmetic all run in your browser, and nothing is uploaded."
    >
      <div role="tablist" aria-label="Tools" className="flex flex-wrap gap-1.5">
        {labTools.map((item) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`lab-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`lab-panel-${item.id}`}
              onClick={() => setActive(item.id)}
              className={cn(
                "border px-3 py-2 font-mono text-[0.625rem] tracking-[0.14em] uppercase transition-colors duration-300",
                selected
                  ? "border-accent-line bg-accent/[0.07] text-accent"
                  : "border-line text-muted hover:border-line-strong hover:text-fg",
              )}
            >
              {item.name}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`lab-panel-${tool.id}`}
        aria-labelledby={`lab-tab-${tool.id}`}
        className="mt-6"
      >
        {/* Keyed so switching tabs mounts a clean tool rather than leaving the
            previous one's input and results behind. */}
        <ToolFrame
          key={tool.id}
          title={tool.name}
          summary={tool.summary}
          does={tool.does}
        >
          {tool.id === "pipeline" && <CsvPipeline />}
          {tool.id === "extract" && <DocumentExtractor />}
          {tool.id === "quote" && <QuoteBuilder />}
        </ToolFrame>
      </div>
    </Section>
  );
}
