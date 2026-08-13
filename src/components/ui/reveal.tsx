"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useSystem } from "@/components/system/system-provider";

/**
 * Scroll reveal.
 *
 * One shared component so the timing is identical everywhere and there is
 * exactly one place that honours `motionEnabled`. When motion is off the
 * children render immediately at their final state — no fade, no transform,
 * no layout difference.
 */
export function Reveal({
  children,
  delay = 0,
  y = 14,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "li" | "article" | "section";
}) {
  const { motionEnabled } = useSystem();
  const MotionTag = motion[as];

  if (!motionEnabled) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{
        duration: 0.55,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </MotionTag>
  );
}
