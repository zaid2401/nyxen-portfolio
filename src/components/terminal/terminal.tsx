"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Section } from "@/components/ui/section";
import { useSystem } from "@/components/system/system-provider";
import { siteConfig } from "@/config/site";
import {
  commandNames,
  runCommand,
  type Line,
} from "@/components/terminal/commands";
import { cn } from "@/lib/utils";

const PROMPT = `${siteConfig.name.toLowerCase()}@${siteConfig.brand.toLowerCase()}:~$`;

const GREETING: Omit<Line, "id">[] = [
  { kind: "accent", content: `${siteConfig.brand} shell — interactive` },
  {
    kind: "muted",
    content:
      "Type `help` to see what this understands. Nothing here is faked: every command runs locally in your browser.",
  },
  { kind: "muted", content: " " },
];

/**
 * A real, if small, shell.
 *
 * Commands genuinely execute — they read the same data files the rest of the
 * page renders from, and `projects` / `open <section>` drive the actual page
 * scroll. There are no simulated network calls and no fake latency.
 *
 * Keyboard: Enter runs, ↑/↓ walks history, Tab completes, Ctrl+L clears.
 * Touch: the whole surface is a label for the input, so tapping anywhere opens
 * the on-screen keyboard.
 */
export function Terminal() {
  const { toggleDevMode, devMode } = useSystem();
  const [lines, setLines] = useState<Line[]>(() =>
    GREETING.map((line, id) => ({ ...line, id })),
  );
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const nextId = useRef(GREETING.length);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const print = useCallback((incoming: Omit<Line, "id">[]) => {
    setLines((current) => [
      ...current,
      ...incoming.map((line) => ({ ...line, id: nextId.current++ })),
    ]);
  }, []);

  const clear = useCallback(() => setLines([]), []);

  // Keep the newest output in view — the container scrolls, never the page.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const unlockDevMode = useCallback(() => {
    if (!devMode) toggleDevMode();
  }, [devMode, toggleDevMode]);

  function submit(raw: string) {
    const entry = raw.trim();
    print([{ kind: "input", content: entry }]);
    setValue("");

    if (entry) {
      setHistory((h) => [...h, entry]);
      setHistoryIndex(-1);
      runCommand(entry, { print, clear, unlockDevMode });
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      submit(value);
      return;
    }

    if (event.key === "l" && event.ctrlKey) {
      event.preventDefault();
      clear();
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      const partial = value.trim().toLowerCase();
      if (!partial) return;
      const matches = commandNames.filter((name) => name.startsWith(partial));
      if (matches.length === 1) {
        setValue(matches[0] + " ");
      } else if (matches.length > 1) {
        print([
          { kind: "input", content: value },
          { kind: "muted", content: matches.join("   ") },
        ]);
      }
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (history.length === 0) return;
      const index =
        historyIndex === -1
          ? history.length - 1
          : Math.max(0, historyIndex - 1);
      setHistoryIndex(index);
      setValue(history[index]);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (historyIndex === -1) return;
      const index = historyIndex + 1;
      if (index >= history.length) {
        setHistoryIndex(-1);
        setValue("");
      } else {
        setHistoryIndex(index);
        setValue(history[index]);
      }
    }
  }

  return (
    <Section
      id="terminal"
      index="05"
      title="Shell"
      kicker="Everything above, reachable by keyboard. The commands are real — they read the same data the page does."
    >
      <div
        className="border-line bg-void corner-ticks relative border"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="border-line bg-raised/60 flex items-center justify-between gap-3 border-b px-4 py-2.5">
          <p className="font-mono text-[0.625rem] tracking-[0.16em] uppercase">
            <span className="text-accent">●</span>{" "}
            <span className="text-muted">
              {siteConfig.brand.toLowerCase()} — shell
            </span>
          </p>
          <p className="text-dim hidden font-mono text-[0.5625rem] tracking-[0.14em] uppercase sm:block">
            help · ↑↓ history · tab complete
          </p>
        </div>

        <div
          ref={scrollRef}
          className="h-[26rem] overflow-x-hidden overflow-y-auto p-4 font-mono text-xs leading-relaxed sm:p-5 sm:text-[0.8125rem]"
        >
          <div role="log" aria-live="polite" aria-label="Terminal output">
            {lines.map((line) => (
              <div
                key={line.id}
                className={cn(
                  "break-words whitespace-pre-wrap",
                  line.kind === "input" && "text-fg mt-3 first:mt-0",
                  line.kind === "output" && "text-fg",
                  line.kind === "muted" && "text-dim",
                  line.kind === "error" && "text-danger",
                  line.kind === "accent" && "text-accent",
                )}
              >
                {line.kind === "input" ? (
                  <>
                    <span className="text-accent">{PROMPT}</span>{" "}
                    <span>{line.content}</span>
                  </>
                ) : (
                  line.content
                )}
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <label htmlFor="terminal-input" className="text-accent shrink-0">
              {PROMPT}
            </label>
            <span className="sr-only">
              Terminal input. Type help and press Enter for a list of commands.
            </span>
            <input
              ref={inputRef}
              id="terminal-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKeyDown}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="go"
              aria-describedby="terminal-hint"
              className="text-fg min-w-0 flex-1 bg-transparent font-mono outline-none"
            />
          </div>
          <p id="terminal-hint" className="sr-only">
            Supported commands: {commandNames.join(", ")}.
          </p>
        </div>
      </div>
    </Section>
  );
}
