"use client";

import { useRef, type PointerEvent } from "react";
import { ArrowUpRight, GitFork, Star, Pin } from "lucide-react";
import type { Repo } from "@/lib/github-shared";
import { languageColor } from "@/lib/languages";
import { formatDate, cn } from "@/lib/utils";
import { usePointerFine } from "@/hooks/use-media-query";
import { useSystem } from "@/components/system/system-provider";

/**
 * Repository card.
 *
 * The pointer effects — a glow that follows the cursor and a very small tilt —
 * are written directly to CSS custom properties on the element in a pointermove
 * handler. No React state, so moving the mouse across the grid does not cause a
 * single re-render. Both are switched off entirely for touch pointers and when
 * motion is disabled.
 *
 * Tilt is capped at 3 degrees on purpose. Anything more reads as a gimmick and
 * makes text edges shimmer.
 */
export function ProjectCard({
  repo,
  onOpen,
}: {
  repo: Repo;
  onOpen: (repo: Repo) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fine = usePointerFine();
  const { motionEnabled } = useSystem();
  const interactive = fine && motionEnabled;

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!interactive) return;
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    el.style.setProperty("--glow-x", `${x}px`);
    el.style.setProperty("--glow-y", `${y}px`);
    el.style.setProperty("--glow-opacity", "1");

    const rx = ((y / rect.height) * 2 - 1) * -3;
    const ry = ((x / rect.width) * 2 - 1) * 3;
    el.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
    el.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
  }

  function onPointerLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--glow-opacity", "0");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  const language = repo.language;

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={
        {
          "--glow-opacity": 0,
          "--rx": "0deg",
          "--ry": "0deg",
          transform: interactive
            ? "perspective(900px) rotateX(var(--rx)) rotateY(var(--ry))"
            : undefined,
        } as React.CSSProperties
      }
      className={cn(
        "group border-line bg-raised/40 hover:border-accent-line relative h-full border transition-[border-color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        repo.featured && "border-accent-line/60",
      )}
    >
      {/* Cursor glow. Sits under the content, clipped to the card. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[var(--glow-opacity)] transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(220px circle at var(--glow-x) var(--glow-y), rgba(47,224,166,0.09), transparent 65%)",
        }}
      />

      <div className="relative flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => onOpen(repo)}
            aria-haspopup="dialog"
            className="min-w-0 text-left outline-offset-4"
          >
            {/* Stretched hit area — the whole card opens the detail view, but
                the accessible name lives on this single control. */}
            <span className="absolute inset-0" aria-hidden="true" />
            <span className="text-fg group-hover:text-accent block truncate font-mono text-[0.9375rem] transition-colors">
              {repo.name}
            </span>
            <span className="sr-only">— open project details</span>
          </button>

          {repo.featured && (
            <Pin
              aria-label="Pinned project"
              className="text-accent h-3.5 w-3.5 shrink-0"
            />
          )}
        </div>

        {repo.description ? (
          <p className="text-muted clamp-3 mt-3 text-sm leading-relaxed">
            {repo.description}
          </p>
        ) : (
          <p className="text-dim mt-3 text-sm italic">
            No description on GitHub yet.
          </p>
        )}

        {repo.topics.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {repo.topics.slice(0, 3).map((topic) => (
              <li
                key={topic}
                className="border-line text-dim border px-1.5 py-0.5 font-mono text-[0.5625rem] tracking-[0.08em] uppercase"
              >
                {topic}
              </li>
            ))}
            {repo.topics.length > 3 && (
              <li className="text-dim px-1 py-0.5 font-mono text-[0.5625rem]">
                +{repo.topics.length - 3}
              </li>
            )}
          </ul>
        )}

        <div className="border-line mt-auto flex items-center gap-4 border-t pt-4 font-mono text-[0.625rem]">
          {language ? (
            <span className="text-muted flex min-w-0 items-center gap-1.5">
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: languageColor(language) }}
              />
              <span className="truncate">{language}</span>
            </span>
          ) : (
            <span className="text-dim">No language</span>
          )}

          {repo.stars > 0 && (
            <span className="text-muted flex items-center gap-1">
              <Star aria-hidden="true" className="h-3 w-3" />
              <span className="tabular-nums">{repo.stars}</span>
              <span className="sr-only">stars</span>
            </span>
          )}
          {repo.forks > 0 && (
            <span className="text-muted flex items-center gap-1">
              <GitFork aria-hidden="true" className="h-3 w-3" />
              <span className="tabular-nums">{repo.forks}</span>
              <span className="sr-only">forks</span>
            </span>
          )}

          <ArrowUpRight
            aria-hidden="true"
            className="text-dim group-hover:text-accent ml-auto h-3.5 w-3.5 shrink-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </div>

        <p className="text-dim mt-2 font-mono text-[0.5625rem] tracking-[0.1em] uppercase">
          Updated {formatDate(repo.pushedAt ?? repo.updatedAt)}
        </p>
      </div>
    </div>
  );
}
