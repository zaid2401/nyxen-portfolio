"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { useSystem } from "@/components/system/system-provider";
import { cn } from "@/lib/utils";

/**
 * The vertical line behind a timeline block. It fills as that block scrolls
 * through the viewport, so the reveal is tied to reading position rather than
 * to a timer.
 *
 * With motion off it renders as a plain static rule — the timeline still reads
 * correctly, it just doesn't draw itself.
 */
export function TimelineRail({
  tone = "accent",
}: {
  tone?: "accent" | "iris";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { motionEnabled } = useSystem();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 75%", "end 55%"],
  });
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="bg-line absolute top-2 bottom-2 left-[7px] w-px sm:left-[9px]"
    >
      {motionEnabled ? (
        <motion.div
          style={{ scaleY }}
          className={cn(
            "absolute inset-0 origin-top bg-gradient-to-b",
            tone === "accent"
              ? "from-accent to-accent/25"
              : "from-iris to-iris/25",
          )}
        />
      ) : (
        <div
          className={cn(
            "absolute inset-0",
            tone === "accent" ? "bg-accent/50" : "bg-iris/50",
          )}
        />
      )}
    </div>
  );
}
