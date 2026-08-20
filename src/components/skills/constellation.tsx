"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Boxes } from "lucide-react";
import { skills, skillEdges, skillById, skillCategories } from "@/data/skills";
import { caseFilesForSkill } from "@/data/case-files";
import type { Repo } from "@/lib/github-shared";
import { reposForSkill } from "@/lib/github-shared";
import { useIsCompact } from "@/hooks/use-media-query";
import { useSystem } from "@/components/system/system-provider";
import { scrollToSection } from "@/lib/navigation";
import { cn, hashString } from "@/lib/utils";

/**
 * Technology graph.
 *
 * Two presentations of the same data, chosen by viewport rather than crammed
 * into one: a positioned constellation on wide screens, and a plain grid of
 * buttons on small ones. The grid is not a degraded fallback — on a phone it is
 * simply the better control, and it is what a screen reader gets either way
 * since both are real `<button>` elements with the same labels.
 *
 * Edges are SVG; the nodes on top of them are HTML buttons, which is what makes
 * focus rings, hit areas and keyboard behaviour work without reimplementing any
 * of it.
 */
export function Constellation({ repos }: { repos: Repo[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const compact = useIsCompact();
  const { motionEnabled } = useSystem();

  const highlighted = useMemo(() => {
    if (!selected) return null;
    const skill = skillById.get(selected);
    return new Set([selected, ...(skill?.related ?? [])]);
  }, [selected]);

  const active = selected ? skillById.get(selected) : null;
  const linkedRepos = useMemo(
    () => (active ? reposForSkill(repos, active.match).slice(0, 4) : []),
    [active, repos],
  );
  const linkedCases = useMemo(
    () => (active ? caseFilesForSkill(active.id) : []),
    [active],
  );

  function toggle(id: string) {
    setSelected((current) => (current === id ? null : id));
  }

  return (
    <div onKeyDown={(e) => e.key === "Escape" && setSelected(null)}>
      {compact ? (
        <ul className="grid grid-cols-2 gap-px sm:grid-cols-3">
          {skills.map((skill) => {
            const on = !highlighted || highlighted.has(skill.id);
            return (
              <li key={skill.id}>
                <button
                  type="button"
                  onClick={() => toggle(skill.id)}
                  aria-pressed={selected === skill.id}
                  className={cn(
                    "flex h-full w-full flex-col items-start gap-1.5 border p-4 text-left transition-colors duration-300",
                    selected === skill.id
                      ? "border-accent-line bg-accent/[0.07]"
                      : "border-line bg-raised/40",
                    !on && "opacity-35",
                  )}
                >
                  <span className="font-mono text-[0.8125rem]">
                    {skill.label}
                  </span>
                  <span className="label-key">
                    {skillCategories[skill.category].label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="border-line bg-raised/30 relative aspect-[16/9] w-full border">
          <div
            aria-hidden="true"
            className="grid-field absolute inset-0 opacity-40"
          />

          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
          >
            {skillEdges.map(([a, b]) => {
              const from = skillById.get(a);
              const to = skillById.get(b);
              if (!from || !to) return null;

              const lit =
                highlighted !== null &&
                highlighted.has(a) &&
                highlighted.has(b) &&
                (a === selected || b === selected);

              return (
                <line
                  key={`${a}-${b}`}
                  x1={6 + from.position.x * 88}
                  y1={8 + from.position.y * 84}
                  x2={6 + to.position.x * 88}
                  y2={8 + to.position.y * 84}
                  stroke={lit ? "var(--color-accent)" : "currentColor"}
                  strokeWidth={lit ? 1.1 : 0.8}
                  vectorEffect="non-scaling-stroke"
                  className={cn(
                    "transition-all duration-500",
                    lit
                      ? "opacity-70"
                      : highlighted
                        ? "text-line opacity-25"
                        : "text-line-strong opacity-70",
                  )}
                />
              );
            })}
          </svg>

          {skills.map((skill) => {
            const on = !highlighted || highlighted.has(skill.id);
            const isSelected = selected === skill.id;
            const drift = (hashString(skill.id) % 2400) / 1000;

            return (
              <button
                key={skill.id}
                type="button"
                onClick={() => toggle(skill.id)}
                aria-pressed={isSelected}
                style={{
                  left: `${6 + skill.position.x * 88}%`,
                  top: `${8 + skill.position.y * 84}%`,
                  animationDelay: `${drift}s`,
                }}
                className={cn(
                  "absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 border px-2.5 py-1.5 font-mono text-[0.6875rem] whitespace-nowrap transition-all duration-500",
                  isSelected
                    ? "border-accent bg-accent/12 text-accent scale-105"
                    : on
                      ? "border-line-strong bg-void/85 text-muted hover:border-accent-line hover:text-fg"
                      : "border-line bg-void/60 text-dim opacity-35",
                  // No idle animation on the nodes: a pulsing ring reads as
                  // "selected" and made the graph look randomly highlighted.
                  motionEnabled && "will-change-transform",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-colors",
                    isSelected ? "bg-accent" : "bg-line-strong",
                  )}
                />
                {skill.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Detail panel. Reserves its own space so selecting a node never shifts
          the page under the pointer. */}
      <div className="border-line bg-raised/40 mt-px min-h-[10.5rem] border p-5 sm:p-6">
        {active ? (
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="label-key">
                {skillCategories[active.category].label}
              </span>
              <span aria-hidden="true" className="bg-line h-px w-5" />
              <h3 className="font-mono text-base">{active.label}</h3>
            </div>

            <p className="text-muted text-balance-pretty mt-3 max-w-2xl text-sm leading-relaxed">
              {active.blurb}
            </p>

            <div className="mt-5">
              <p className="label-key">Applied in</p>
              {linkedCases.length > 0 ? (
                <ul className="mt-2.5 flex flex-wrap gap-1.5">
                  {linkedCases.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => scrollToSection("case-files")}
                        className="border-accent-line/50 text-accent bg-accent/[0.05] hover:border-accent flex items-center gap-1.5 border px-2 py-1 font-mono text-[0.625rem] transition-colors"
                      >
                        <span className="text-accent/60">#{item.index}</span>
                        {item.name}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-dim mt-2 font-mono text-xs italic">
                  No documented case file uses this directly.
                </p>
              )}
            </div>

            <div className="mt-5">
              <p className="label-key">Related repositories</p>
              {linkedRepos.length > 0 ? (
                <ul className="mt-2.5 flex flex-wrap gap-1.5">
                  {linkedRepos.map((repo) => (
                    <li key={repo.id}>
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border-line text-muted hover:border-accent-line hover:text-accent flex items-center gap-1.5 border px-2 py-1 font-mono text-[0.625rem] transition-colors"
                      >
                        {repo.name}
                        <ArrowUpRight aria-hidden="true" className="h-3 w-3" />
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-dim mt-2 font-mono text-xs italic">
                  No public repository on GitHub currently matches this
                  technology.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-dim flex h-full flex-col justify-center gap-3">
            <p className="flex items-center gap-2.5 font-mono text-xs">
              <Boxes aria-hidden="true" className="h-4 w-4" />
              Select a technology to see how it connects and which repositories
              use it.
            </p>
            <p className="text-dim/80 max-w-xl text-xs leading-relaxed">
              No proficiency scores here on purpose — a self-assigned percentage
              tells you nothing. The repositories linked under each node are
              pulled from the GitHub API and speak for themselves.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
