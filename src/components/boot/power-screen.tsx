"use client";

import { useEffect, useRef } from "react";
import { Power } from "lucide-react";
import { useSystem } from "@/components/system/system-provider";
import { siteConfig } from "@/config/site";
import { Emblem } from "@/components/ui/emblem";

/**
 * The power screen — the first thing a visitor sees.
 *
 * A deliberate gate rather than an animation: nothing happens until someone
 * presses the button, which is the point of the metaphor. Pressing it powers
 * the system on, the boot sequence runs, and the landing page follows.
 *
 * Rules it follows, all of them the same ones the boot overlay follows:
 *  • It appears on every page load, reload included — power state is the one
 *    piece of start-up state that is deliberately not remembered. The boot
 *    animation still runs only once per session, so a reload is one press and
 *    then straight through.
 *  • The page content is already in the DOM behind it — this is an overlay, not
 *    a redirect — so a crawler or a reader-mode extension sees the real page.
 *  • Enter, Space or the button all activate it, and the button holds focus
 *    from the start, so it is reachable without a pointer.
 *  • Nothing here animates in a way that matters. With reduced motion the pulse
 *    stops and the button still works identically.
 */
export function PowerScreen() {
  const { powered, powerOn, motionEnabled } = useSystem();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (powered) return;

    buttonRef.current?.focus();

    // Any of the usual "go" keys starts the system, so nobody is stuck
    // hunting for a target.
    const onKey = (event: KeyboardEvent) => {
      if (
        event.key === "Enter" ||
        event.key === " " ||
        event.key === "Spacebar"
      ) {
        event.preventDefault();
        powerOn();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [powered, powerOn]);

  if (powered) return null;

  return (
    <div
      id="power-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${siteConfig.brand} — start the system`}
      className="bg-void fixed inset-0 z-[120] flex flex-col items-center justify-center px-6"
    >
      <div
        aria-hidden="true"
        className="grid-field pointer-events-none absolute inset-0 opacity-[0.35]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,var(--color-void)_75%)]"
      />

      <div className="relative flex flex-col items-center text-center">
        <span className="text-accent/70 h-10 w-10">
          <Emblem />
        </span>

        <h1 className="mt-6 font-mono text-[0.9375rem] tracking-[0.4em] uppercase sm:text-lg">
          {siteConfig.brand}
        </h1>
        <p className="text-dim mt-3 font-mono text-[0.625rem] tracking-[0.24em] uppercase">
          System offline
        </p>

        {/* The button. Large, obvious, and the only thing to do here. */}
        <button
          ref={buttonRef}
          type="button"
          onClick={powerOn}
          className="group border-line-strong hover:border-accent focus-visible:border-accent relative mt-12 flex h-24 w-24 items-center justify-center rounded-full border transition-colors duration-500 outline-none sm:h-28 sm:w-28"
        >
          <span className="sr-only">
            Power on and enter the {siteConfig.brand} interface
          </span>

          {/* Idle halo. Purely a "this is the thing" cue, and it stops dead
              when reduced motion is requested. */}
          {motionEnabled && (
            <span
              aria-hidden="true"
              className="border-accent/25 animate-pulse-node absolute inset-0 rounded-full border"
            />
          )}

          <span
            aria-hidden="true"
            className="bg-accent/[0.04] group-hover:bg-accent/[0.12] absolute inset-2 rounded-full transition-colors duration-500"
          />

          <Power
            aria-hidden="true"
            className="text-accent relative h-8 w-8 transition-transform duration-500 group-hover:scale-110 sm:h-9 sm:w-9"
          />
        </button>

        <p className="text-muted mt-10 font-mono text-[0.6875rem] tracking-[0.2em] uppercase">
          Press to start
        </p>
        <p className="text-dim/70 mt-2.5 font-mono text-[0.5625rem] tracking-[0.14em]">
          or press Enter
        </p>
      </div>
    </div>
  );
}
