"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSystem } from "@/components/system/system-provider";
import { siteConfig } from "@/config/site";
import { Emblem } from "@/components/ui/emblem";
import { cn } from "@/lib/utils";

/**
 * Boot sequence.
 *
 * Rules it follows:
 *  • It is short. Four steps, ~1.6s end to end. Nobody's time is being spent on
 *    a loading screen that isn't loading anything.
 *  • It runs once per session. The inline script in the document head reads
 *    `sessionStorage`, so a returning visitor never sees a frame of it.
 *  • Reduced motion skips it entirely — the animated component is never even
 *    mounted, rather than mounted and then hidden.
 *  • Escape, Enter, Space or the Skip button end it immediately, and the skip
 *    control is the first thing in the tab order.
 */

const STEPS = [
  { label: "Loading interface", detail: "ui/render" },
  { label: "Loading modules", detail: "sections" },
  { label: "Connecting to GitHub", detail: "api/repos" },
  { label: "Preparing workspace", detail: "ready" },
] as const;

const STEP_MS = 260;
const ONLINE_MS = 340;
const FADE_MS = 420;
const BAR_CELLS = 22;

export function BootSequence() {
  const { powered, booted, reducedMotion } = useSystem();

  // Nothing runs before the power button is pressed — otherwise the sequence
  // would play behind the power screen and be over before anyone saw it.
  if (!powered) return null;
  if (booted) return null;
  if (reducedMotion) return <SkipBoot />;
  return <BootAnimation />;
}

/** Reduced motion: mark the session booted and render nothing at all. */
function SkipBoot() {
  const { completeBoot } = useSystem();

  useEffect(() => {
    completeBoot();
  }, [completeBoot]);

  return null;
}

function BootAnimation() {
  const { completeBoot } = useSystem();
  const [step, setStep] = useState(0);
  const [online, setOnline] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const skipRef = useRef<HTMLButtonElement>(null);
  const finished = useRef(false);

  const finish = useCallback(
    (immediate = false) => {
      if (finished.current) return;
      finished.current = true;
      if (immediate) {
        completeBoot();
        return;
      }
      setLeaving(true);
      window.setTimeout(completeBoot, FADE_MS);
    },
    [completeBoot],
  );

  // Advance the sequence.
  useEffect(() => {
    const timers: number[] = [];
    STEPS.forEach((_, index) => {
      timers.push(
        window.setTimeout(() => setStep(index + 1), STEP_MS * (index + 1)),
      );
    });
    timers.push(
      window.setTimeout(() => setOnline(true), STEP_MS * STEPS.length + 80),
    );
    timers.push(
      window.setTimeout(
        () => finish(),
        STEP_MS * STEPS.length + 80 + ONLINE_MS,
      ),
    );

    return () => timers.forEach(window.clearTimeout);
  }, [finish]);

  // Keyboard escape hatch + scroll lock while the overlay is up.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (["Escape", "Enter", " ", "Spacebar"].includes(event.key)) {
        event.preventDefault();
        finish(true);
      }
    };
    document.addEventListener("keydown", onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    skipRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [finish]);

  const progress = Math.min(step / STEPS.length, 1);
  const filled = Math.round(progress * BAR_CELLS);

  return (
    <div
      id="boot-overlay"
      className={cn(
        "bg-void fixed inset-0 z-[100] flex items-center justify-center",
        "transition-opacity duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
        leaving && "pointer-events-none opacity-0",
      )}
    >
      <div
        aria-hidden="true"
        className="grid-field pointer-events-none absolute inset-0 opacity-[0.35]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,var(--color-void)_78%)]"
      />

      <button
        ref={skipRef}
        type="button"
        onClick={() => finish(true)}
        className="text-dim hover:text-fg hover:border-line-strong absolute top-5 right-5 z-10 border border-transparent px-3 py-2 font-mono text-[0.625rem] tracking-[0.18em] uppercase transition-colors sm:top-7 sm:right-8"
      >
        Skip intro
        <span className="sr-only"> and go to the page content</span>
      </button>

      <div
        role="status"
        aria-live="polite"
        aria-label="System starting up"
        className="relative w-full max-w-md px-6 font-mono text-[0.75rem] sm:text-[0.8125rem]"
      >
        <div className="mb-7 flex items-center gap-3">
          <span className="text-accent h-8 w-8">
            <Emblem />
          </span>
          <div className="leading-tight">
            <p className="tracking-[0.3em] uppercase">
              {siteConfig.brand} System
            </p>
            <p className="text-dim mt-1 text-[0.625rem] tracking-[0.2em] uppercase">
              Initializing
            </p>
          </div>
        </div>

        <ul className="space-y-1.5">
          {STEPS.map((item, index) => {
            const done = step > index;
            const active = step === index;
            return (
              <li
                key={item.detail}
                className={cn(
                  "flex items-center justify-between gap-4 transition-opacity duration-300",
                  done ? "opacity-100" : active ? "opacity-70" : "opacity-25",
                )}
              >
                <span className="truncate">
                  <span className="text-dim mr-2">›</span>
                  {item.label}
                  {active && !done && (
                    <span className="animate-caret ml-1 inline-block">_</span>
                  )}
                </span>
                <span
                  className={cn(
                    "shrink-0 text-[0.625rem] tracking-[0.14em]",
                    done ? "text-accent" : "text-dim",
                  )}
                >
                  {done ? "OK" : "··"}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-7">
          <div className="text-accent flex justify-between text-[0.6875rem] tracking-[0.12em]">
            <span aria-hidden="true" className="truncate">
              {"█".repeat(filled)}
              <span className="text-dim">{"░".repeat(BAR_CELLS - filled)}</span>
            </span>
            <span className="text-muted ml-3 shrink-0 tabular-nums">
              {Math.round(progress * 100)}%
            </span>
          </div>
        </div>

        <p
          className={cn(
            "text-accent mt-6 tracking-[0.28em] uppercase transition-opacity duration-300",
            online ? "opacity-100" : "opacity-0",
          )}
        >
          System online
        </p>
      </div>
    </div>
  );
}
