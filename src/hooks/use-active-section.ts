"use client";

import { useEffect, useState } from "react";
import type { SectionId } from "@/config/site";

/**
 * Tracks which section owns the viewport, for the nav's active indicator.
 *
 * Uses a single IntersectionObserver with a band across the upper-middle of
 * the screen rather than a scroll listener, so it costs nothing while idle and
 * doesn't fight the browser's scrolling.
 */
export function useActiveSection(ids: SectionId[]): SectionId | null {
  const [active, setActive] = useState<SectionId | null>(null);

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const visible = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry.intersectionRatio);
          } else {
            visible.delete(entry.target.id);
          }
        }

        let best: string | null = null;
        let bestRatio = 0;
        for (const [id, ratio] of visible) {
          if (ratio >= bestRatio) {
            best = id;
            bestRatio = ratio;
          }
        }
        if (best) setActive(best as SectionId);
      },
      {
        // A band from just under the header to the middle of the screen.
        rootMargin: "-15% 0px -55% 0px",
        threshold: [0, 0.15, 0.35, 0.6, 1],
      },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);

  return active;
}
