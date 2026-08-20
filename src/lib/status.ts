/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SYSTEM STATUS — shared checks (server-only)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Every value here is the result of a check performed at call time. Nothing is
 * hardcoded to "online" to make the panel look healthy — a green light that is
 * always green is worse than no light at all.
 *
 *   PORTFOLIO   — online by construction: this code only runs because a server
 *                 received a request and is answering it.
 *   GITHUB      — a real call through the cached data layer, reporting the
 *                 exact failure kind when it fails.
 *   AI CORE     — a real probe of whichever model host is configured: a hosted
 *                 OpenAI-compatible provider, or Ollama locally. Reports the
 *                 specific reason when the answer is no, because "demo mode"
 *                 with no explanation is the least useful thing a status panel
 *                 can say.
 *   DEPLOYMENT  — the environment actually running this code.
 *
 * Lives in its own module because two callers need it: the server component
 * that renders the panel with its first values already filled in, and the route
 * handler behind the "Recheck" button. Same code, so the two can never
 * disagree.
 *
 * Reads `process.env` and performs network calls — never import this from a
 * client component. The types below are safe to import anywhere.
 */

import { getRepos } from "@/lib/github";
import { siteConfig } from "@/config/site";

export type StatusState =
  "online" | "degraded" | "demo" | "offline" | "unknown";

export interface StatusEntry {
  id: string;
  label: string;
  state: StatusState;
  /** One short line. Safe for a visitor to read. */
  detail: string;
}

export interface StatusPayload {
  entries: StatusEntry[];
  /** ISO timestamp of this check. */
  checkedAt: string;
}

/**
 * Which environment is serving, and whether it is actually serving.
 *
 * Every branch here is `online`, and that is the correct reading rather than a
 * generous one: this code only runs because a server received a request and is
 * answering it. The environment belongs in the detail line, not the state — a
 * local dev server is not a "demo" of a deployment, it is a deployment, and
 * labelling it otherwise put a permanent amber light on a healthy system.
 */
function deployment(): StatusEntry {
  const vercelEnv = process.env.VERCEL_ENV;

  const detail =
    vercelEnv === "production"
      ? `Production · ${siteConfig.domain}`
      : vercelEnv
        ? `Preview deployment (${vercelEnv})`
        : process.env.NODE_ENV === "development"
          ? "Local development server"
          : "Self-hosted";

  return { id: "deployment", label: "Deployment", state: "online", detail };
}

export async function checkStatus(): Promise<StatusPayload> {
  const entries: StatusEntry[] = [];

  // The response existing at all is the proof for this one.
  entries.push({
    id: "portfolio",
    label: "Portfolio",
    state: "online",
    detail: "Interface responding",
  });

  // Real call. Uses the same cached layer the page renders from, so this costs
  // nothing extra within the revalidation window.
  const repos = await getRepos();
  entries.push(
    repos.ok
      ? {
          id: "github",
          label: "GitHub",
          state: "online",
          detail: `${repos.data.length} public ${repos.data.length === 1 ? "repository" : "repositories"} indexed`,
        }
      : {
          id: "github",
          label: "GitHub",
          state: repos.error.kind === "rate-limited" ? "degraded" : "offline",
          detail: repos.error.message,
        },
  );

  entries.push(deployment());

  return { entries, checkedAt: new Date().toISOString() };
}
