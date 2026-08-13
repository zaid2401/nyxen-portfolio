"use client";

import { useEffect, useState } from "react";
import { useSystem } from "@/components/system/system-provider";
import { cn } from "@/lib/utils";

/**
 * All three roles are always visible and always readable — the animation only
 * moves which one is emphasised. Nothing appears, disappears or reflows, so
 * there is no layout shift and no waiting to read a job title.
 *
 * With motion disabled every role simply renders at full contrast.
 */
export function RoleCycle({ roles }: { roles: readonly string[] }) {
  const { motionEnabled } = useSystem();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!motionEnabled) return;
    const id = window.setInterval(
      () => setActive((i) => (i + 1) % roles.length),
      2600,
    );
    return () => window.clearInterval(id);
  }, [motionEnabled, roles.length]);

  return (
    <ul className="flex flex-col gap-1.5 font-mono text-sm sm:text-[0.9375rem]">
      {roles.map((role, index) => {
        const on = !motionEnabled || index === active;
        return (
          <li key={role} className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className={cn(
                "h-px transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                on ? "bg-accent w-6" : "bg-line-strong w-3",
              )}
            />
            <span
              className={cn(
                "tracking-[0.06em] transition-colors duration-700",
                on ? "text-fg" : "text-dim",
              )}
            >
              {role}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
