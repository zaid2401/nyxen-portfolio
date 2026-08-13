"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSystem } from "@/components/system/system-provider";
import { useKonami } from "@/hooks/use-konami";

/**
 * Easter egg #2 — the Konami code opens a small telemetry read-out.
 *
 * It shows real numbers (frame rate, viewport, motion state), which is the
 * joke: the hidden feature is a performance panel. Dismissed with Escape or
 * the same code again.
 */
export function DevHud() {
  const { devMode, toggleDevMode, effects, reducedMotion } = useSystem();
  const [fps, setFps] = useState(0);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  useKonami(toggleDevMode);

  useEffect(() => {
    if (!devMode) return;

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && toggleDevMode();
    window.addEventListener("keydown", onKey);

    const onResize = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize);

    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const loop = () => {
      frames += 1;
      const now = performance.now();
      if (now - last >= 1000) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, [devMode, toggleDevMode]);

  const rows: [string, string][] = [
    ["fps", fps ? String(fps) : "—"],
    ["viewport", `${viewport.w}×${viewport.h}`],
    ["effects", effects ? "on" : "off"],
    ["reduced-motion", reducedMotion ? "true" : "false"],
    [
      "dpr",
      typeof window !== "undefined" ? String(window.devicePixelRatio) : "—",
    ],
  ];

  return (
    <AnimatePresence>
      {devMode && (
        <motion.aside
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          role="status"
          aria-label="Developer telemetry"
          className="border-accent-line bg-void/92 fixed right-4 bottom-4 z-[70] w-[188px] border p-3 font-mono text-[0.625rem] backdrop-blur-md"
        >
          <p className="text-accent mb-2 tracking-[0.2em] uppercase">
            ▚ dev mode
          </p>
          <dl className="space-y-1">
            {rows.map(([key, value]) => (
              <div key={key} className="flex justify-between gap-3">
                <dt className="text-dim">{key}</dt>
                <dd className="text-fg tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-dim border-line mt-2.5 border-t pt-2">
            esc to close
          </p>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
