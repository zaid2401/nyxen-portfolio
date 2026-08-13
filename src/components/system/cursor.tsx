"use client";

import { useEffect, useRef } from "react";
import { usePointerFine } from "@/hooks/use-media-query";
import { useSystem } from "@/components/system/system-provider";

const INTERACTIVE =
  'a,button,input,textarea,select,summary,[role="option"],[tabindex]:not([tabindex="-1"])';

/**
 * Cursor enhancement.
 *
 * Deliberately additive: the native cursor is never hidden. A soft ring trails
 * the pointer and widens over interactive targets, which reads as responsive
 * without ever leaving someone unsure where they are actually clicking.
 *
 * Mounted only for fine pointers, and removed entirely when effects are off or
 * reduced motion is requested. Position is written straight to `transform` in a
 * rAF loop — no React state, so this costs no re-renders.
 */
export function Cursor() {
  const fine = usePointerFine();
  const { motionEnabled } = useSystem();
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  const enabled = fine && motionEnabled;

  useEffect(() => {
    if (!enabled) return;

    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;
    let scale = 1;
    let targetScale = 1;
    let visible = false;
    let frame = 0;

    const onMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;

      if (!visible) {
        visible = true;
        ring.style.opacity = "1";
        dot.style.opacity = "1";
        // Jump on first sight so the ring doesn't fly in from the centre.
        x = targetX;
        y = targetY;
      }

      const el = event.target as Element | null;
      targetScale = el?.closest?.(INTERACTIVE) ? 1.9 : 1;
    };

    const onLeave = () => {
      visible = false;
      ring.style.opacity = "0";
      dot.style.opacity = "0";
    };

    const tick = () => {
      x += (targetX - x) * 0.16;
      y += (targetY - y) * 0.16;
      scale += (targetScale - scale) * 0.14;

      ring.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[80]"
    >
      <div
        ref={ringRef}
        className="border-accent/45 absolute top-0 left-0 h-7 w-7 rounded-full border opacity-0 transition-opacity duration-300"
      />
      <div
        ref={dotRef}
        className="bg-accent absolute top-0 left-0 h-[3px] w-[3px] rounded-full opacity-0 transition-opacity duration-300"
      />
    </div>
  );
}
