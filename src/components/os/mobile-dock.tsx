"use client";

import { Home, FolderKanban, Network, FlaskConical } from "lucide-react";
import { dockSections } from "@/config/site";
import type { SectionId } from "@/config/site";
import { useActiveSection } from "@/hooks/use-active-section";
import { scrollToSection } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * Mobile bottom dock.
 *
 * Not a shrunken toolbar — a different control for a different hand. Four
 * destinations, thumb-height, at the bottom of the screen where a thumb
 * actually reaches. Everything else stays one tap away in the menu.
 *
 * Hidden on md and up, where the system bar is the better instrument, and
 * hidden from assistive technology there too rather than merely visually: two
 * navigations with the same links would otherwise both be announced.
 */

const ICONS: Record<string, typeof Home> = {
  hero: Home,
  "case-files": FolderKanban,
  skills: Network,
  lab: FlaskConical,
};

const DOCK_IDS = dockSections.map((s) => s.id) as SectionId[];

export function MobileDock() {
  const active = useActiveSection(DOCK_IDS);

  return (
    <nav
      aria-label="Primary"
      className="border-line bg-void/92 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md items-stretch">
        {dockSections.map((section) => {
          const Icon = ICONS[section.id] ?? Home;
          const isActive = active === section.id;
          return (
            <li key={section.id} className="flex-1">
              <button
                type="button"
                onClick={() => scrollToSection(section.id)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "flex w-full flex-col items-center gap-1 py-2.5 transition-colors",
                  isActive ? "text-accent" : "text-dim",
                )}
              >
                <span className="relative">
                  <Icon
                    aria-hidden="true"
                    className="h-[1.15rem] w-[1.15rem]"
                  />
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="bg-accent absolute -top-2.5 left-1/2 h-px w-5 -translate-x-1/2"
                    />
                  )}
                </span>
                <span className="font-mono text-[0.5625rem] tracking-[0.1em] uppercase">
                  {section.short ?? section.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
