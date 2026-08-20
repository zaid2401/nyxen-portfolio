"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCw } from "lucide-react";
import type { StatusEntry, StatusPayload, StatusState } from "@/lib/status";
import { cn } from "@/lib/utils";

/**
 * Live system status.
 *
 * Every light here is the result of a check that actually ran on the server —
 * see `src/app/api/status/route.ts`. Nothing is hardcoded green. While the
 * check is in flight the panel says "checking", not "online", because a status
 * panel that guesses optimistically is worse than none at all.
 *
 * The server render supplies `initial` so the panel is populated in the first
 * paint with no loading flash. Because this page is statically generated those
 * values date from build time, so the panel re-checks for real the moment it
 * scrolls into view, and the footer says which of the two you are looking at.
 */

const STATE_STYLES: Record<
  StatusState,
  { dot: string; text: string; mark: string }
> = {
  online: { dot: "text-accent", text: "text-accent", mark: "●" },
  degraded: { dot: "text-warn", text: "text-warn", mark: "◐" },
  demo: { dot: "text-iris", text: "text-iris", mark: "○" },
  offline: { dot: "text-danger", text: "text-danger", mark: "○" },
  unknown: { dot: "text-dim", text: "text-dim", mark: "·" },
};

const STATE_LABEL: Record<StatusState, string> = {
  online: "Online",
  degraded: "Degraded",
  demo: "Demo mode",
  offline: "Unavailable",
  unknown: "Checking",
};

export function SystemStatus({
  initial,
  className,
}: {
  initial: StatusPayload;
  className?: string;
}) {
  const [entries, setEntries] = useState<StatusEntry[]>(initial.entries);
  const [checkedAt, setCheckedAt] = useState<string>(initial.checkedAt);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const check = useCallback(async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/status", { cache: "no-store" });
      const body = (await response.json()) as StatusPayload;
      if (Array.isArray(body.entries)) {
        setEntries(body.entries);
        setCheckedAt(body.checkedAt);
        setLive(true);
      }
    } catch {
      // Offline, or the route is down — which is itself a status worth showing.
      setEntries((current) =>
        current.map((entry) => ({
          ...entry,
          state: "unknown" as const,
          detail: "Status check could not complete",
        })),
      );
    } finally {
      setBusy(false);
    }
  }, []);

  /**
   * Re-check when the panel actually comes into view.
   *
   * The server-rendered values exist so the panel is populated in the first
   * paint, but this page is statically generated: those values are from
   * *build* time. For a status panel that is close to useless — the moment an
   * environment variable changes after a build, the lights are lying, and the
   * "last checked" timestamp is quietly reporting when the site was compiled.
   *
   * Checking on visibility rather than on mount also means the request happens
   * when someone is actually reading the panel, not on every page load, and the
   * timestamp reflects a check that genuinely just ran.
   */
  useEffect(() => {
    const node = panelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (visibleEntries) => {
        if (!visibleEntries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        check();
      },
      { rootMargin: "0px 0px 25% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [check]);

  return (
    <div
      ref={panelRef}
      className={cn(
        "border-line bg-raised/40 corner-ticks relative border",
        className,
      )}
    >
      <div className="border-line flex items-center justify-between gap-3 border-b px-4 py-2.5">
        <p className="label-key">System status</p>
        <button
          type="button"
          onClick={check}
          disabled={busy}
          className="text-dim hover:text-accent flex items-center gap-1.5 font-mono text-[0.5625rem] tracking-[0.14em] uppercase transition-colors disabled:opacity-50"
        >
          <RotateCw
            aria-hidden="true"
            className={cn("h-2.5 w-2.5", busy && "motion-safe:animate-spin")}
          />
          {busy ? "Checking" : "Recheck"}
        </button>
      </div>

      <ul role="list" aria-live="polite" className="divide-line divide-y">
        {entries.map((entry) => {
          const style = STATE_STYLES[entry.state];
          return (
            <li
              key={entry.id}
              className="flex items-start justify-between gap-4 px-4 py-3"
            >
              <div className="flex min-w-0 items-baseline gap-2.5">
                <span
                  aria-hidden="true"
                  className={cn(
                    "shrink-0 font-mono text-[0.625rem]",
                    style.dot,
                  )}
                >
                  {style.mark}
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-[0.75rem] tracking-[0.08em]">
                    {entry.label}
                  </p>
                  <p className="text-dim mt-1 text-[0.6875rem] leading-relaxed">
                    {entry.detail}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "shrink-0 font-mono text-[0.5625rem] tracking-[0.14em] uppercase",
                  style.text,
                )}
              >
                {STATE_LABEL[entry.state]}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="text-dim border-line border-t px-4 py-2.5 font-mono text-[0.5625rem] tracking-[0.12em] uppercase">
        {live ? "Last checked" : "Built"}{" "}
        <time dateTime={checkedAt}>
          {new Date(checkedAt).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZone: "UTC",
          })}{" "}
          UTC
        </time>
      </p>
    </div>
  );
}
