"use client";

import { useState } from "react";
import { ArrowRight, ArrowUpRight, Lock, ChevronRight } from "lucide-react";
import { GithubIcon } from "@/components/ui/brand-icons";
import { caseFiles, type CaseFile } from "@/data/case-files";
import { Dialog } from "@/components/ui/dialog";
import { ActionLink, Chip } from "@/components/ui/action";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

/**
 * The grid and the detail view.
 *
 * The card carries the problem — not the tech list — because that is what
 * makes someone open it. Technology is metadata; the problem is the story.
 */
export function CaseFilesClient({
  repoUrls,
}: {
  repoUrls: Record<string, string>;
}) {
  const [open, setOpen] = useState<CaseFile | null>(null);

  return (
    <>
      <ul className="grid gap-px lg:grid-cols-2">
        {caseFiles.map((item, index) => (
          <Reveal as="li" key={item.id} delay={0.05 * index}>
            <CaseCard item={item} onOpen={() => setOpen(item)} />
          </Reveal>
        ))}
      </ul>

      <CaseDialog
        item={open}
        repoUrl={open ? repoUrls[open.id] : undefined}
        onClose={() => setOpen(null)}
      />
    </>
  );
}

function CaseCard({ item, onOpen }: { item: CaseFile; onOpen: () => void }) {
  const headline = item.result.metrics[0];

  return (
    <article className="group border-line bg-raised/40 hover:border-accent-line relative flex h-full flex-col border p-5 transition-colors duration-300 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="text-accent font-mono text-[0.625rem] tracking-[0.18em]">
          CASE FILE #{item.index}
        </span>
        <span aria-hidden="true" className="bg-line h-px flex-1" />
        <span
          className={cn(
            "flex items-center gap-1 font-mono text-[0.5625rem] tracking-[0.12em] uppercase",
            item.visibility === "public" ? "text-muted" : "text-dim",
          )}
        >
          {item.visibility === "public" ? (
            <>
              <GithubIcon aria-hidden="true" className="h-2.5 w-2.5" />
              Public
            </>
          ) : (
            <>
              <Lock aria-hidden="true" className="h-2.5 w-2.5" />
              Internal
            </>
          )}
        </span>
      </div>

      <h3 className="mt-4 text-xl font-semibold tracking-tight">
        <button
          type="button"
          onClick={onOpen}
          aria-haspopup="dialog"
          className="text-left outline-offset-4"
        >
          {/* Stretched hit area — the whole card opens, but the accessible
              name lives on this single control. */}
          <span aria-hidden="true" className="absolute inset-0" />
          <span className="group-hover:text-accent transition-colors">
            {item.name}
          </span>
          <span className="sr-only"> — open the full case file</span>
        </button>
      </h3>

      {item.context && (
        <p className="text-dim mt-1.5 font-mono text-[0.6875rem]">
          {item.context}
          {item.period && ` · ${item.period}`}
        </p>
      )}

      <p className="text-muted mt-4 text-[0.9375rem] leading-relaxed">
        {item.summary}
      </p>

      {/* Result, when one was measured. This is the part that earns attention. */}
      {headline ? (
        <div className="border-accent-line/40 bg-accent/[0.04] mt-5 border-l-2 py-2 pl-4">
          <p className="label-key">{headline.label}</p>
          <p className="mt-1.5 flex flex-wrap items-baseline gap-2 font-mono text-sm">
            <span className="text-dim line-through decoration-1">
              {headline.before}
            </span>
            <ArrowRight aria-hidden="true" className="text-dim h-3 w-3" />
            <span className="text-accent">{headline.after}</span>
            {headline.delta && (
              <span className="text-muted text-[0.6875rem]">
                ({headline.delta})
              </span>
            )}
          </p>
        </div>
      ) : (
        item.result.note && (
          <p className="border-line text-dim mt-5 border-l-2 py-2 pl-4 text-[0.8125rem] leading-relaxed">
            {item.result.note}
          </p>
        )
      )}

      <ul className="mt-5 flex flex-wrap gap-1.5">
        {item.stack.slice(0, 4).map((tech) => (
          <li key={tech}>
            <Chip>{tech}</Chip>
          </li>
        ))}
        {item.stack.length > 4 && (
          <li className="text-dim self-center px-1 font-mono text-[0.625rem]">
            +{item.stack.length - 4}
          </li>
        )}
      </ul>

      <p className="text-dim group-hover:text-accent mt-auto flex items-center gap-1.5 pt-6 font-mono text-[0.625rem] tracking-[0.14em] uppercase transition-colors">
        Open case file
        <ChevronRight
          aria-hidden="true"
          className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
        />
      </p>
    </article>
  );
}

/**
 * The full case study: problem → approach → architecture → implementation →
 * result, in that order, because that is the order the reasoning happened in.
 */
function CaseDialog({
  item,
  repoUrl,
  onClose,
}: {
  item: CaseFile | null;
  repoUrl?: string;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={item !== null}
      onClose={onClose}
      labelId="case-dialog-title"
      title={
        item && (
          <>
            <p className="text-accent font-mono text-[0.625rem] tracking-[0.18em]">
              CASE FILE #{item.index}
            </p>
            <h3 className="mt-1.5 text-lg font-semibold tracking-tight">
              {item.name}
            </h3>
          </>
        )
      }
    >
      {item && (
        <div className="space-y-8">
          <Block label="Problem">
            <p className="text-muted text-[0.9375rem] leading-relaxed">
              {item.problem}
            </p>
          </Block>

          <Block label="Approach">
            <p className="text-muted text-[0.9375rem] leading-relaxed">
              {item.approach}
            </p>
          </Block>

          <Block label="Architecture">
            <ol className="space-y-px">
              {item.architecture.map((stage, index) => (
                <li
                  key={stage.label}
                  className="border-line bg-void/40 flex gap-4 border p-3.5"
                >
                  <span className="text-accent/70 shrink-0 font-mono text-[0.625rem] tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-[0.8125rem]">{stage.label}</p>
                    <p className="text-dim mt-1 text-[0.8125rem] leading-relaxed">
                      {stage.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Block>

          <Block label="Implementation notes">
            <ul className="space-y-2.5">
              {item.implementation.map((note) => (
                <li
                  key={note}
                  className="text-muted flex gap-3 text-[0.875rem] leading-relaxed"
                >
                  <span
                    aria-hidden="true"
                    className="bg-accent/50 mt-[0.62em] h-px w-3 shrink-0"
                  />
                  {note}
                </li>
              ))}
            </ul>
          </Block>

          <Block label="Technology">
            <ul className="flex flex-wrap gap-1.5">
              {item.stack.map((tech) => (
                <li key={tech}>
                  <Chip>{tech}</Chip>
                </li>
              ))}
            </ul>
          </Block>

          <Block label="Result">
            {item.result.metrics.length > 0 ? (
              <dl className="grid gap-px sm:grid-cols-2">
                {item.result.metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="border-accent-line/40 bg-accent/[0.04] border p-4"
                  >
                    <dt className="label-key">{metric.label}</dt>
                    <dd className="mt-2.5 flex flex-wrap items-baseline gap-2 font-mono text-sm">
                      <span className="text-dim line-through decoration-1">
                        {metric.before}
                      </span>
                      <ArrowRight
                        aria-hidden="true"
                        className="text-dim h-3 w-3"
                      />
                      <span className="text-accent text-base">
                        {metric.after}
                      </span>
                    </dd>
                    {metric.delta && (
                      <p className="text-muted mt-1.5 font-mono text-[0.6875rem]">
                        {metric.delta}
                      </p>
                    )}
                  </div>
                ))}
              </dl>
            ) : null}

            {item.result.note && (
              <p
                className={cn(
                  "text-muted text-[0.875rem] leading-relaxed",
                  item.result.metrics.length > 0 && "mt-4",
                )}
              >
                {item.result.note}
              </p>
            )}
          </Block>

          <div className="border-line flex flex-wrap gap-2 border-t pt-6">
            {repoUrl ? (
              <ActionLink href={repoUrl} variant="primary">
                <GithubIcon aria-hidden="true" className="h-3.5 w-3.5" />
                View source
                <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
              </ActionLink>
            ) : (
              <p className="text-dim flex items-center gap-2 font-mono text-[0.6875rem] leading-relaxed">
                <Lock aria-hidden="true" className="h-3 w-3 shrink-0" />
                {item.visibility === "internal"
                  ? "Built internally — the source belongs to the employer and is not public."
                  : "Source repository is not currently available."}
              </p>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}

function Block({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3.5 flex items-center gap-3">
        <h4 className="label-key">{label}</h4>
        <span aria-hidden="true" className="bg-line h-px flex-1" />
      </div>
      {children}
    </section>
  );
}
