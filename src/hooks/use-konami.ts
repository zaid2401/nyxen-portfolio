"use client";

import { useEffect, useRef } from "react";

const SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

/**
 * Konami code listener.
 *
 * Ignores keystrokes while a text field has focus, so typing "…ba" into the
 * terminal or the contact form never trips it.
 */
export function useKonami(onUnlock: () => void) {
  const position = useRef(0);
  const handler = useRef(onUnlock);

  // Kept in an effect rather than assigned during render — a ref must not be
  // written while rendering.
  useEffect(() => {
    handler.current = onUnlock;
  }, [onUnlock]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const expected = SEQUENCE[position.current];
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

      if (key === expected) {
        position.current += 1;
        if (position.current === SEQUENCE.length) {
          position.current = 0;
          handler.current();
        }
      } else {
        // Allow a wrong key to be the start of a fresh attempt.
        position.current = key === SEQUENCE[0] ? 1 : 0;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
