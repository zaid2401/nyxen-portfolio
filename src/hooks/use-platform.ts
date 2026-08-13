"use client";

import { useSyncExternalStore } from "react";

/** The platform never changes mid-session, so there is nothing to subscribe to. */
const noSubscription = () => () => {};

/**
 * True on macOS and iOS, used to label the command-palette shortcut ⌘K rather
 * than Ctrl K.
 *
 * Read through `useSyncExternalStore` so the server renders "Ctrl" and the
 * client corrects it after hydration — the supported way to consume a
 * browser-only value without a mismatch or a setState in an effect.
 */
export function useIsApplePlatform(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => /Mac|iPhone|iPad|iPod/.test(navigator.userAgent),
    () => false,
  );
}
