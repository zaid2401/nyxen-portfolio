"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { Menu, X } from "lucide-react";
import { GithubIcon } from "@/components/ui/brand-icons";
import {
  navSections,
  siteConfig,
  githubUrl,
  isPlaceholder,
} from "@/config/site";
import type { SectionId } from "@/config/site";
import { useActiveSection } from "@/hooks/use-active-section";
import { useIsApplePlatform } from "@/hooks/use-platform";
import { useSystem } from "@/components/system/system-provider";
import { scrollToSection } from "@/lib/navigation";
import { Emblem } from "@/components/ui/emblem";
import { cn } from "@/lib/utils";

const NAV_IDS = navSections.map((s) => s.id);

export function NavBar() {
  const active = useActiveSection(NAV_IDS as SectionId[]);
  const { setPaletteOpen, replayBoot } = useSystem();
  const [open, setOpen] = useState(false);
  const isMac = useIsApplePlatform();
  const [scrolled, setScrolled] = useState(false);
  const emblemClicks = useRef(0);
  const clickTimer = useRef<number | null>(null);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 40,
    restDelta: 0.001,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    // Initial sync is deferred a frame rather than run inline, so a page
    // restored mid-scroll gets the right header without a cascading render.
    const frame = requestAnimationFrame(onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Close the mobile sheet on Escape, and lock the page behind it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  /** Easter egg #1 — five taps on the emblem reboots the interface. */
  function onEmblemClick() {
    emblemClicks.current += 1;
    if (clickTimer.current) window.clearTimeout(clickTimer.current);
    clickTimer.current = window.setTimeout(() => {
      emblemClicks.current = 0;
    }, 1200);

    if (emblemClicks.current >= 5) {
      emblemClicks.current = 0;
      replayBoot();
      window.scrollTo({ top: 0, behavior: "auto" });
    } else {
      scrollToSection("hero");
    }
  }

  function go(id: SectionId) {
    setOpen(false);
    scrollToSection(id);
  }

  return (
    <>
      <a
        href="#about"
        className="bg-accent text-void sr-only rounded-none px-4 py-2 font-mono text-xs tracking-widest uppercase focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[110]"
      >
        Skip to content
      </a>

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
          scrolled
            ? "border-line bg-void/80 border-b backdrop-blur-xl"
            : "border-b border-transparent",
        )}
      >
        {/* Reading progress. 1px, accent, no label — it's ambient, not a control. */}
        <motion.div
          aria-hidden="true"
          style={{ scaleX: progress }}
          className="bg-accent absolute inset-x-0 bottom-0 h-px origin-left"
        />

        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <button
            type="button"
            onClick={onEmblemClick}
            className="group flex items-center gap-2.5 outline-none"
            aria-label={`${siteConfig.brand} — back to top`}
          >
            <span className="text-accent group-hover:text-accent h-6 w-6 transition-transform duration-500 group-hover:rotate-[-8deg]">
              <Emblem live />
            </span>
            <span className="font-mono text-[0.8125rem] tracking-[0.3em] uppercase">
              {siteConfig.brand}
            </span>
          </button>

          <nav
            aria-label="Sections"
            className="hidden items-center gap-1 lg:flex"
          >
            {navSections.map((section) => {
              const isActive = active === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => go(section.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "relative px-3 py-2 font-mono text-[0.6875rem] tracking-[0.16em] uppercase transition-colors duration-300",
                    isActive ? "text-fg" : "text-muted hover:text-fg",
                  )}
                >
                  {section.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="bg-accent absolute inset-x-3 -bottom-px h-px"
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="border-line text-dim hover:border-line-strong hover:text-muted hidden items-center gap-2 border px-2.5 py-1.5 font-mono text-[0.625rem] tracking-[0.12em] transition-colors sm:flex"
              aria-label="Open command palette"
            >
              <span aria-hidden="true">{isMac ? "⌘" : "Ctrl"}</span>
              <span aria-hidden="true">K</span>
            </button>

            {!isPlaceholder(siteConfig.githubUsername) && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-fg p-2 transition-colors"
                aria-label="GitHub profile (opens in a new tab)"
              >
                <GithubIcon
                  aria-hidden="true"
                  className="h-[1.05rem] w-[1.05rem]"
                />
              </a>
            )}

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="text-muted hover:text-fg p-2 transition-colors lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? (
                <X aria-hidden="true" className="h-5 w-5" />
              ) : (
                <Menu aria-hidden="true" className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile sheet. Full-height, large touch targets, one column. */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="bg-void/97 fixed inset-0 z-40 backdrop-blur-xl lg:hidden"
      >
        <nav
          aria-label="Sections"
          className="flex h-full flex-col justify-center gap-1 px-6 pb-16"
        >
          {navSections.map((section, index) => (
            <button
              key={section.id}
              type="button"
              onClick={() => go(section.id)}
              className={cn(
                "border-line flex items-baseline gap-4 border-b py-4 text-left text-lg transition-colors",
                active === section.id ? "text-accent" : "text-fg",
              )}
            >
              <span className="text-dim font-mono text-[0.625rem] tracking-[0.16em]">
                {String(index + 1).padStart(2, "0")}
              </span>
              {section.label}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
