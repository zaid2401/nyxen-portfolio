"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Media query as state.
 *
 * `useSyncExternalStore` is the right primitive here: matchMedia is an external
 * store, and this is exactly the case React supports where the server snapshot
 * (`false`) legitimately differs from the client's — it re-renders after
 * hydration without a mismatch warning and without a setState in an effect.
 *
 * Anything that must not flash should be handled in CSS instead; this is for
 * behavioural branching, not layout.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** True when the OS asks for reduced motion. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/**
 * True for a real mouse or trackpad. Drives every pointer-dependent effect:
 * the cursor ring, hero pointer attraction and card tilt are all gated on this
 * so touch devices never pay for them.
 */
export function usePointerFine(): boolean {
  return useMediaQuery("(hover: hover) and (pointer: fine)");
}

/** Small viewports get lighter particle counts and simplified visuals. */
export function useIsCompact(): boolean {
  return useMediaQuery("(max-width: 767px)");
}
