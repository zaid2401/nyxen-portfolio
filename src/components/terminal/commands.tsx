"use client";

import type { ReactNode } from "react";
import { siteConfig, githubUrl, isPlaceholder, sections } from "@/config/site";
import { identityRows, work, education } from "@/data/experience";
import { skills, skillCategories } from "@/data/skills";
import { scrollToSection } from "@/lib/navigation";
import { formatPeriodRange, isPresent, roleDuration } from "@/lib/duration";

export interface Line {
  id: number;
  kind: "input" | "output" | "muted" | "error" | "accent";
  content: ReactNode;
}

export interface CommandContext {
  print: (lines: Omit<Line, "id">[]) => void;
  clear: () => void;
  /** Konami-adjacent: `sudo` three times unlocks the dev read-out. */
  unlockDevMode: () => void;
}

interface Command {
  name: string;
  summary: string;
  hidden?: boolean;
  run: (args: string[], ctx: CommandContext) => void;
}

/* ── Small output helpers ──────────────────────────────────────────────────── */

function text(content: ReactNode): Omit<Line, "id"> {
  return { kind: "output", content };
}
function muted(content: ReactNode): Omit<Line, "id"> {
  return { kind: "muted", content };
}
function accent(content: ReactNode): Omit<Line, "id"> {
  return { kind: "accent", content };
}
function error(content: ReactNode): Omit<Line, "id"> {
  return { kind: "error", content };
}
function blank(): Omit<Line, "id"> {
  return { kind: "muted", content: " " };
}

function TermLink({ href, children }: { href: string; children: ReactNode }) {
  const external = /^https?:/i.test(href);
  return (
    <a
      href={href}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : undefined)}
      className="text-accent underline decoration-dotted underline-offset-2 hover:decoration-solid"
    >
      {children}
      {external && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
}

function row(key: string, value: ReactNode): Omit<Line, "id"> {
  return {
    kind: "output",
    content: (
      <span className="flex gap-3">
        <span className="text-dim w-28 shrink-0">{key}</span>
        <span className="min-w-0 break-words">{value}</span>
      </span>
    ),
  };
}

/* ── The registry ──────────────────────────────────────────────────────────── */

let sudoCount = 0;

export const commands: Command[] = [
  {
    name: "help",
    summary: "List every available command",
    run: (_args, ctx) => {
      ctx.print([
        accent("Available commands"),
        blank(),
        ...commands
          .filter((c) => !c.hidden)
          .map((c) =>
            row(c.name, <span className="text-muted">{c.summary}</span>),
          ),
        blank(),
        muted("↑ / ↓ recalls history · Tab completes · Ctrl+L clears"),
      ]);
    },
  },
  {
    name: "about",
    summary: "Identity read-out",
    run: (_args, ctx) => {
      ctx.print([
        accent("$ whoami"),
        blank(),
        ...identityRows.map((r) => row(r.key.toLowerCase(), r.value)),
        blank(),
        muted("Full section: type `open about`"),
      ]);
    },
  },
  {
    name: "skills",
    summary: "Technologies, grouped by area",
    run: (_args, ctx) => {
      const groups = new Map<string, string[]>();
      for (const skill of skills) {
        const label = skillCategories[skill.category].label;
        groups.set(label, [...(groups.get(label) ?? []), skill.label]);
      }
      ctx.print([
        accent("Technology"),
        blank(),
        ...[...groups.entries()].map(([group, items]) =>
          row(group.toLowerCase(), items.join("  ·  ")),
        ),
        blank(),
        muted(
          "No proficiency scores — see the Technology section for context.",
        ),
      ]);
    },
  },
  {
    name: "projects",
    summary: "Jump to the live GitHub project feed",
    run: (_args, ctx) => {
      ctx.print([
        text("Projects are pulled live from the GitHub API."),
        muted("Navigating to the Projects section…"),
      ]);
      scrollToSection("projects");
    },
  },
  {
    name: "experience",
    summary: "Work history",
    run: (_args, ctx) => {
      ctx.print([
        accent("Work"),
        blank(),
        ...work.map((entry) =>
          row(
            formatPeriodRange(entry.start, entry.end),
            <>
              <span className="text-fg">{entry.role}</span>
              <span className="text-dim"> — {entry.company}</span>
              <span className="text-dim">
                {" ("}
                {roleDuration(entry.start, entry.end)}
                {isPresent(entry.end) ? ", current" : ""}
                {")"}
              </span>
            </>,
          ),
        ),
        blank(),
        muted("Full detail: type `open experience`"),
      ]);
    },
  },
  {
    name: "education",
    summary: "Academic history",
    run: (_args, ctx) => {
      ctx.print([
        accent("Education"),
        blank(),
        ...education.map((entry) =>
          row(
            formatPeriodRange(entry.start, entry.end),
            <>
              <span className="text-fg">{entry.qualification}</span>
              <span className="text-dim"> — {entry.institution}</span>
            </>,
          ),
        ),
      ]);
    },
  },
  {
    name: "github",
    summary: "GitHub profile link",
    run: (_args, ctx) => {
      if (isPlaceholder(siteConfig.githubUsername)) {
        ctx.print([
          error("No GitHub account is linked on this deployment yet."),
        ]);
        return;
      }
      ctx.print([
        text(<TermLink href={githubUrl}>{githubUrl}</TermLink>),
        muted("Opens in a new tab."),
      ]);
    },
  },
  {
    name: "contact",
    summary: "How to get in touch",
    run: (_args, ctx) => {
      const lines: Omit<Line, "id">[] = [];

      if (isPlaceholder(siteConfig.email)) {
        lines.push(
          row("email", <span className="text-dim">Not available</span>),
        );
      } else {
        lines.push(
          row(
            "email",
            <TermLink href={`mailto:${siteConfig.email}`}>
              {siteConfig.email}
            </TermLink>,
          ),
        );
      }

      if (!isPlaceholder(siteConfig.linkedin)) {
        lines.push(
          row(
            "linkedin",
            <TermLink href={siteConfig.linkedin}>
              {siteConfig.linkedin}
            </TermLink>,
          ),
        );
      }
      if (!isPlaceholder(siteConfig.githubUsername)) {
        lines.push(
          row("github", <TermLink href={githubUrl}>{githubUrl}</TermLink>),
        );
      }

      ctx.print([accent("Contact"), blank(), ...lines]);
    },
  },
  {
    name: "open",
    summary: "Scroll to a section — `open projects`",
    run: (args, ctx) => {
      const target = args[0]?.toLowerCase();
      const known = sections.map((s) => s.id) as string[];

      if (!target) {
        ctx.print([
          error("Usage: open <section>"),
          muted(`Sections: ${known.join(", ")}`),
        ]);
        return;
      }
      if (!known.includes(target)) {
        ctx.print([
          error(`Unknown section: ${target}`),
          muted(`Sections: ${known.join(", ")}`),
        ]);
        return;
      }
      ctx.print([muted(`Navigating to ${target}…`)]);
      scrollToSection(target);
    },
  },
  {
    name: "ls",
    summary: "List the sections of this site",
    run: (_args, ctx) => {
      ctx.print([
        text(
          <span className="flex flex-wrap gap-x-5 gap-y-1">
            {sections.map((s) => (
              <span key={s.id} className="text-accent">
                {s.id}/
              </span>
            ))}
          </span>,
        ),
      ]);
    },
  },
  {
    name: "whoami",
    summary: "Print the current user",
    run: (_args, ctx) => {
      ctx.print([text(siteConfig.name.toLowerCase())]);
    },
  },
  {
    name: "clear",
    summary: "Clear the terminal",
    run: (_args, ctx) => ctx.clear(),
  },

  /* ── Easter eggs ────────────────────────────────────────────────────────── */
  {
    name: "sudo",
    summary: "Elevate privileges",
    hidden: true,
    run: (args, ctx) => {
      sudoCount += 1;
      if (sudoCount >= 3) {
        sudoCount = 0;
        ctx.unlockDevMode();
        ctx.print([
          accent("Privilege escalation accepted. Developer read-out enabled."),
          muted("Press Escape to dismiss it. (The Konami code does this too.)"),
        ]);
        return;
      }
      ctx.print([
        error(
          `${siteConfig.name.toLowerCase()} is not in the sudoers file. This incident has been reported.`,
        ),
        muted(
          sudoCount === 2
            ? "…although persistence is a documented engineering trait."
            : `Attempt ${sudoCount}.`,
        ),
      ]);
    },
  },
  {
    name: "nyxen",
    summary: "Print the banner",
    hidden: true,
    run: (_args, ctx) => {
      ctx.print([
        {
          kind: "accent",
          content: (
            <pre className="overflow-x-auto text-[0.6875rem] leading-tight">
              {`╔╗╔╦ ╦═╗ ╦╔═╗╔╗╔
║║║╚╦╝╔╩╦╝║╣ ║║║
╝╚╝ ╩ ╩ ╚═╚═╝╝╚╝`}
            </pre>
          ),
        },
        muted(`${siteConfig.brand} — built with curiosity & code.`),
      ]);
    },
  },
  {
    name: "exit",
    summary: "Leave the terminal",
    hidden: true,
    run: (_args, ctx) => {
      ctx.print([muted("There is no exit. Try `open contact` instead.")]);
    },
  },
];

export const commandNames = commands.map((c) => c.name);

export function runCommand(input: string, ctx: CommandContext): void {
  const trimmed = input.trim();
  if (!trimmed) return;

  const [name, ...args] = trimmed.split(/\s+/);
  const command = commands.find((c) => c.name === name.toLowerCase());

  if (!command) {
    ctx.print([
      { kind: "error", content: `command not found: ${name}` },
      { kind: "muted", content: "Type `help` for the list." },
    ]);
    return;
  }
  command.run(args, ctx);
}
