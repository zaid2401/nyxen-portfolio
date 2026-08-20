import type { ReactNode } from "react";
import { PowerScreen } from "@/components/boot/power-screen";
import { BootSequence } from "@/components/boot/boot-sequence";
import { SystemBar } from "@/components/os/system-bar";
import { MobileDock } from "@/components/os/mobile-dock";
import { CommandPalette } from "@/components/navigation/command-palette";
import { OverlayHost } from "@/components/os/overlay-host";
import { Cursor } from "@/components/system/cursor";
import { DevHud } from "@/components/system/dev-hud";

/**
 * The NYXEN interface shell.
 *
 * Scoped to this route group rather than the root layout, which matters for
 * correctness and not just tidiness: the system bar and the mobile dock
 * navigate to sections on the main page, and mounting them on a route that has
 * no such sections would leave a row of controls that quietly do nothing.
 * Recruiter mode therefore renders outside this group, with its own minimal
 * chrome — which is also exactly what that mode is supposed to be.
 *
 * A route group adds no segment to the URL, so the main page is still `/`.
 */
export default function OsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PowerScreen />
      <BootSequence />
      <SystemBar />
      {/* pb-16 on small screens clears the fixed mobile dock so the last
          section is never trapped behind it. */}
      <main id="content" className="pb-16 md:pb-0">
        {children}
      </main>
      <MobileDock />
      <CommandPalette />
      <OverlayHost />
      <Cursor />
      <DevHud />
    </>
  );
}
