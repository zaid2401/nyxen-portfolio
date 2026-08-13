"use client";

import type { SectionId } from "@/config/site";

/**
 * Programmatic scroll used by the nav, command palette and terminal.
 *
 * Moves focus to the target section as well as scrolling to it, so keyboard
 * and screen-reader users end up in the same place as everyone else — a plain
 * `scrollIntoView` leaves focus stranded at the top of the document.
 */
export function scrollToSection(id: SectionId | string): boolean {
  const target = document.getElementById(id);
  if (!target) return false;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({
    behavior: reduced ? "auto" : "smooth",
    block: "start",
  });

  // `tabindex="-1"` is set on sections so this is focusable without adding
  // them to the tab order.
  target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });

  if (history.replaceState) history.replaceState(null, "", `#${id}`);
  return true;
}

/** Opens an external URL in a new tab with the safe rel semantics. */
export function openExternal(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}
