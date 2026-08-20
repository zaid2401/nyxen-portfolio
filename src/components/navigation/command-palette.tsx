"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Mail,
  Power,
  RotateCcw,
  Search,
  CornerDownLeft,
  ArrowRight,
  Zap,
} from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/brand-icons";
import { siteConfig, githubUrl, isPlaceholder, sections } from "@/config/site";
import { useSystem } from "@/components/system/system-provider";
import { openExternal, scrollToSection } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface Command {
  id: string;
  label: string;
  group: "Navigate" | "Links" | "Interface" | "System";
  icon: ReactNode;
  keywords?: string;
  hint?: string;
  run: () => void;
}

/**
 * Ctrl/⌘K command palette.
 *
 * Split in two on purpose: this outer component owns only the global shortcut,
 * and the panel below is mounted fresh each time it opens. The query and
 * selection reset because the component is new — not because an effect reached
 * in and reset them.
 */
export function CommandPalette() {
  const { paletteOpen, setPaletteOpen } = useSystem();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(!paletteOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen, setPaletteOpen]);

  return (
    <AnimatePresence>
      {paletteOpen && <PalettePanel onClose={() => setPaletteOpen(false)} />}
    </AnimatePresence>
  );
}

/**
 * Implements the combobox + listbox pattern properly: the input keeps focus and
 * announces the highlighted option through `aria-activedescendant`, arrow keys
 * move the selection without moving focus, Escape closes and returns focus to
 * whatever opened it.
 */
function PalettePanel({ onClose }: { onClose: () => void }) {
  const { effects, toggleEffects, replayBoot } = useSystem();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands = useMemo<Command[]>(() => {
    const navigational: Command[] = sections
      .filter((s) => s.id !== "hero")
      .map((s) => ({
        id: `go-${s.id}`,
        label: `Go to ${s.label}`,
        group: "Navigate" as const,
        icon: <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />,
        keywords: s.id,
        run: () => {
          onClose();
          scrollToSection(s.id);
        },
      }));

    const system: Command[] = [
      {
        id: "recruiter",
        label: "Open recruiter mode",
        group: "System",
        icon: <Zap aria-hidden="true" className="h-3.5 w-3.5" />,
        keywords: "hire hiring cv resume summary",
        hint: "/recruiter",
        run: () => {
          onClose();
          router.push("/recruiter");
        },
      },
    ];

    const links: Command[] = [];
    if (!isPlaceholder(siteConfig.githubUsername)) {
      links.push({
        id: "open-github",
        label: "Open GitHub",
        group: "Links",
        icon: <GithubIcon aria-hidden="true" className="h-3.5 w-3.5" />,
        hint: `@${siteConfig.githubUsername}`,
        run: () => {
          onClose();
          openExternal(githubUrl);
        },
      });
    }
    if (!isPlaceholder(siteConfig.linkedin)) {
      links.push({
        id: "open-linkedin",
        label: "Open LinkedIn",
        group: "Links",
        icon: <LinkedinIcon aria-hidden="true" className="h-3.5 w-3.5" />,
        run: () => {
          onClose();
          openExternal(siteConfig.linkedin);
        },
      });
    }
    if (!isPlaceholder(siteConfig.email)) {
      links.push({
        id: "email",
        label: "Send an email",
        group: "Links",
        icon: <Mail aria-hidden="true" className="h-3.5 w-3.5" />,
        hint: siteConfig.email,
        run: () => {
          onClose();
          window.location.href = `mailto:${siteConfig.email}`;
        },
      });
    }

    const ui: Command[] = [
      {
        id: "toggle-effects",
        label: effects ? "Turn off visual effects" : "Turn on visual effects",
        group: "Interface",
        icon: <Power aria-hidden="true" className="h-3.5 w-3.5" />,
        keywords: "animation motion particles performance",
        hint: effects ? "On" : "Off",
        run: () => {
          toggleEffects();
          onClose();
        },
      },
      {
        id: "replay-boot",
        label: "Replay boot sequence",
        group: "Interface",
        icon: <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />,
        keywords: "restart reboot intro",
        run: () => {
          onClose();
          window.scrollTo({ top: 0, behavior: "auto" });
          replayBoot();
        },
      },
    ];

    return [...navigational, ...system, ...links, ...ui];
  }, [onClose, effects, toggleEffects, replayBoot, router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((command) =>
      `${command.label} ${command.group} ${command.keywords ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [commands, query]);

  // Focus the input on open, lock the page, and hand focus back on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => inputRef.current?.focus());

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  // Keep the highlighted row in view as the selection moves.
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${index}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [index]);

  const onSearchChange = useCallback((value: string) => {
    setQuery(value);
    setIndex(0);
  }, []);

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setIndex((i) => (filtered.length ? (i + 1) % filtered.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setIndex((i) =>
        filtered.length ? (i - 1 + filtered.length) % filtered.length : 0,
      );
    } else if (event.key === "Home") {
      event.preventDefault();
      setIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setIndex(Math.max(filtered.length - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      filtered[index]?.run();
    }
  }

  let lastGroup = "";

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh] sm:pt-[16vh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
    >
      <div
        className="bg-void/70 absolute inset-0 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        initial={{ opacity: 0, y: -8, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.99 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="border-line-strong bg-raised relative w-full max-w-lg border shadow-2xl shadow-black/60"
        onKeyDown={onKeyDown}
      >
        <div className="border-line flex items-center gap-3 border-b px-4">
          <Search aria-hidden="true" className="text-dim h-4 w-4 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => onSearchChange(e.target.value)}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-autocomplete="list"
            aria-activedescendant={
              filtered[index] ? `palette-option-${index}` : undefined
            }
            placeholder="Type a command…"
            className="placeholder:text-dim w-full bg-transparent py-4 font-mono text-sm outline-none"
          />
          <kbd className="border-line text-dim hidden shrink-0 border px-1.5 py-0.5 font-mono text-[0.5625rem] tracking-[0.1em] uppercase sm:block">
            Esc
          </kbd>
        </div>

        <div
          ref={listRef}
          id="palette-list"
          role="listbox"
          aria-label="Commands"
          className="max-h-[52vh] overflow-y-auto py-2"
        >
          {filtered.length === 0 && (
            <p className="text-dim px-4 py-8 text-center font-mono text-xs">
              No matching command.
            </p>
          )}

          {filtered.map((command, i) => {
            const showGroup = command.group !== lastGroup;
            lastGroup = command.group;
            const selected = i === index;

            return (
              <div key={command.id}>
                {showGroup && (
                  <p className="label-key px-4 pt-3 pb-1.5">{command.group}</p>
                )}
                <div
                  id={`palette-option-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={selected}
                  onMouseMove={() => setIndex(i)}
                  onClick={() => command.run()}
                  className={cn(
                    "mx-2 flex cursor-pointer items-center gap-3 px-2 py-2.5 text-sm transition-colors",
                    selected ? "bg-accent/[0.09] text-fg" : "text-muted",
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0",
                      selected ? "text-accent" : "text-dim",
                    )}
                  >
                    {command.icon}
                  </span>
                  <span className="flex-1 truncate">{command.label}</span>
                  {command.hint && (
                    <span className="text-dim shrink-0 truncate font-mono text-[0.625rem]">
                      {command.hint}
                    </span>
                  )}
                  {selected && (
                    <CornerDownLeft
                      aria-hidden="true"
                      className="text-dim h-3 w-3 shrink-0"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
