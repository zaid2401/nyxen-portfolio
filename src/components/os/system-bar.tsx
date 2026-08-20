"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useSpring } from "framer-motion";
import { Menu, X, Zap } from "lucide-react";
import { GithubIcon } from "@/components/ui/brand-icons";
import {
  navSections,
  sections,
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

/**
 * NYXEN — system bar.
 *
 * The toolbar of the interface: identity and status on the left, sections in
 * the middle, system actions on the right. It reads as an OS chrome rather than
 * a website header, but every control is a real, focusable element with an
 * accessible name — the metaphor never costs anything.
 *
 * One deliberate layout decision: the section list scrolls horizontally instead
 * of wrapping or collapsing. Nine sections cannot fit a laptop toolbar at a
 * readable size, and the two usual fixes are both worse — wrapping makes the
 * header jump height mid-scroll, and hiding the nav below 1280px would strand
 * laptop users in a mobile menu. A toolbar that scrolls is also the honest
 * metaphor: that is what an OS toolbar does when it runs out of room.
 */

const NAV_IDS = navSections.map((s) => s.id);
const ALL_IDS = sections.filter((s) => s.id !== "hero").map((s) => s.id);

export function SystemBar() {
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
        href="#content"
        className="bg-accent text-void sr-only px-4 py-2 font-mono text-xs tracking-widest uppercase focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[110]"
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
        {/* Reading progress. 1px, accent, no label — ambient, not a control. */}
        <motion.div
          aria-hidden="true"
          style={{ scaleX: progress }}
          className="bg-accent absolute inset-x-0 bottom-0 h-px origin-left"
        />

        <div className="mx-auto flex h-16 w-full max-w-[92rem] items-center gap-3 px-4 sm:px-6">
          {/* ── Identity + status ─────────────────────────────────────────── */}
          <button
            type="button"
            onClick={onEmblemClick}
            className="group flex shrink-0 items-center gap-2.5 outline-none"
            aria-label={`${siteConfig.brand} — back to top`}
          >
            <span className="text-accent h-6 w-6 transition-transform duration-500 group-hover:rotate-[-8deg]">
              <Emblem live />
            </span>
            <span className="hidden font-mono text-[0.8125rem] leading-none tracking-[0.3em] uppercase sm:inline">
              {siteConfig.brand}
            </span>
          </button>

          <span
            aria-hidden="true"
            className="bg-line hidden h-4 w-px shrink-0 lg:block"
          />

          <p className="text-dim hidden shrink-0 items-center gap-1.5 font-mono text-[0.5625rem] tracking-[0.18em] uppercase lg:flex">
            <span className="led text-accent" />
            System online
          </p>

          {/* ── Sections ──────────────────────────────────────────────────── */}
          <nav
            aria-label="Sections"
            className="hide-scrollbar hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto md:flex"
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
                    "relative shrink-0 px-2.5 py-2 font-mono text-[0.625rem] tracking-[0.14em] whitespace-nowrap uppercase transition-colors duration-300",
                    isActive ? "text-fg" : "text-muted hover:text-fg",
                  )}
                >
                  <span className="lg:hidden">
                    {section.short ?? section.label}
                  </span>
                  <span className="hidden lg:inline">{section.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="bg-accent absolute inset-x-2.5 -bottom-px h-px"
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* ── System actions ────────────────────────────────────────────── */}
          <div className="ml-auto flex shrink-0 items-center gap-1.5 md:ml-0">
            <Link
              href="/recruiter"
              className="border-accent-line text-accent bg-accent/[0.06] hover:bg-accent/[0.14] hover:border-accent hidden items-center gap-1.5 border px-2.5 py-1.5 font-mono text-[0.625rem] tracking-[0.12em] uppercase transition-colors sm:flex"
            >
              <Zap aria-hidden="true" className="h-3 w-3" />
              Recruiter
            </Link>

            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="border-line text-dim hover:border-line-strong hover:text-muted hidden items-center gap-2 border px-2.5 py-1.5 font-mono text-[0.625rem] tracking-[0.12em] transition-colors lg:flex"
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
                className="text-muted hover:text-fg hidden p-2 transition-colors sm:block"
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
              className="text-muted hover:text-fg p-2 transition-colors md:hidden"
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

      {/* Mobile sheet. Every section, large touch targets, one column. */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="bg-void/97 fixed inset-0 z-40 overflow-y-auto backdrop-blur-xl md:hidden"
      >
        <nav
          aria-label="All sections"
          className="flex min-h-full flex-col justify-center gap-0.5 px-6 pt-24 pb-28"
        >
          {ALL_IDS.map((id, index) => {
            const section = sections.find((s) => s.id === id);
            if (!section) return null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => go(id)}
                className={cn(
                  "border-line flex items-baseline gap-4 border-b py-4 text-left text-lg transition-colors",
                  active === id ? "text-accent" : "text-fg",
                )}
              >
                <span className="text-dim font-mono text-[0.625rem] tracking-[0.16em]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {section.label}
              </button>
            );
          })}

          <Link
            href="/recruiter"
            onClick={() => setOpen(false)}
            className="border-accent-line text-accent bg-accent/[0.06] mt-6 flex items-center justify-center gap-2 border px-4 py-4 font-mono text-[0.6875rem] tracking-[0.16em] uppercase"
          >
            <Zap aria-hidden="true" className="h-3.5 w-3.5" />
            Recruiter mode
          </Link>
        </nav>
      </div>
    </>
  );
}
