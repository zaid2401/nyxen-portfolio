/**
 * ─────────────────────────────────────────────────────────────────────────────
 * GITHUB DATA LAYER  (server-only)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Design notes:
 *
 * 1. This module never throws at the call site. Every export returns a
 *    discriminated `GitHubResult`, so the UI always has a concrete state to
 *    render — data, or a specific, human-readable failure.
 *
 * 2. Nothing is invented. If GitHub omits a description, language, homepage or
 *    topic list, that absence is preserved as `null` / `[]` and the UI says so.
 *
 * 3. `GITHUB_TOKEN` is read from the server environment only. It is never
 *    prefixed `NEXT_PUBLIC_`, never returned in a payload, and never reaches
 *    the browser. Everything here runs on the server or in a route handler.
 *
 * 4. Requests are cached with Next's ISR window (`siteConfig.revalidateSeconds`)
 *    and tagged `github`, so a page view does not mean an API call. A new
 *    public repo appears on the next revalidation with no code change — that
 *    is the whole point of this file.
 */

import { siteConfig, isPlaceholder } from "@/config/site";
import {
  deriveCategories,
  type GitHubError,
  type GitHubResult,
  type Profile,
  type Repo,
} from "@/lib/github-shared";

// Types and pure logic live in `github-shared.ts` so client components can use
// them without pulling this module (and its env access) into the browser bundle.
export type {
  GitHubError,
  GitHubErrorKind,
  GitHubResult,
  Profile,
  Repo,
} from "@/lib/github-shared";
export {
  availableCategories,
  categoryRules,
  reposForSkill,
} from "@/lib/github-shared";

const API = "https://api.github.com";

/* ═══════════════════════════════════════════════════════════════════════════
   REQUEST PLUMBING
   ═══════════════════════════════════════════════════════════════════════════ */

function isConfigured(): boolean {
  return (
    siteConfig.githubUsername.length > 0 &&
    !isPlaceholder(siteConfig.githubUsername)
  );
}

const NOT_CONFIGURED: GitHubError = {
  kind: "not-configured",
  message: "GitHub account not linked yet.",
  hint: "Set `githubUsername` in src/config/site.ts — that one value wires up Projects, Activity and Skills.",
};

function authHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "nyxen-portfolio",
  };
  // Server-side only. Absent in the browser bundle because this module is
  // only ever imported from server components and route handlers.
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/** Maps an HTTP status onto a specific, non-leaky error. */
function errorForResponse(res: Response): GitHubError {
  const remaining = res.headers.get("x-ratelimit-remaining");

  if (res.status === 404) {
    return {
      kind: "not-found",
      message: `No public GitHub account found for “${siteConfig.githubUsername}”.`,
      hint: "Check the spelling of `githubUsername` in src/config/site.ts.",
    };
  }
  if (res.status === 401) {
    return {
      kind: "unauthorized",
      message: "GitHub rejected the request credentials.",
      hint: "GITHUB_TOKEN is set but invalid or expired. Remove it to fall back to unauthenticated public access.",
    };
  }
  if (res.status === 403 || res.status === 429) {
    if (remaining === "0") {
      return {
        kind: "rate-limited",
        message: "GitHub rate limit reached. Data will return shortly.",
        hint: "Unauthenticated requests are capped at 60/hour per IP. Add GITHUB_TOKEN to .env.local for 5,000/hour.",
      };
    }
    return {
      kind: "rate-limited",
      message: "GitHub temporarily refused the request.",
    };
  }
  return {
    kind: "unavailable",
    message: "GitHub is not responding as expected right now.",
    hint: `Upstream status ${res.status}.`,
  };
}

interface RequestOptions {
  /** Overrides the default ISR window. */
  revalidate?: number;
  /** Skips the cache entirely — used by the client-side "Retry" action. */
  fresh?: boolean;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<GitHubResult<T>> {
  try {
    const res = await fetch(`${API}${path}`, {
      headers: authHeaders(),
      ...(options.fresh
        ? { cache: "no-store" as const }
        : {
            next: {
              revalidate: options.revalidate ?? siteConfig.revalidateSeconds,
              tags: ["github"],
            },
          }),
    });

    if (!res.ok) return { ok: false, error: errorForResponse(res) };
    return { ok: true, data: (await res.json()) as T };
  } catch {
    // Network failure, DNS, timeout, offline build — never surfaced raw.
    return {
      ok: false,
      error: {
        kind: "network",
        message: "Could not reach GitHub.",
        hint: "The build machine or server has no network access to api.github.com.",
      },
    };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   VALIDATION
   External data is untrusted. Every field is checked before it reaches JSX.
   ═══════════════════════════════════════════════════════════════════════════ */

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function strArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );
}

/** Only http(s) links are ever rendered as hrefs. */
function safeUrl(value: unknown): string | null {
  const raw = str(value);
  if (!raw) return null;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function normaliseRepo(raw: unknown): Repo | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  const name = str(r.name);
  const url = safeUrl(r.html_url);
  const id = typeof r.id === "number" ? r.id : null;
  if (!name || !url || id === null) return null; // Unusable without these.

  const language = str(r.language);
  const topics = strArray(r.topics);

  const license =
    typeof r.license === "object" && r.license !== null
      ? str((r.license as Record<string, unknown>).spdx_id)
      : null;

  return {
    id,
    name,
    fullName: str(r.full_name) ?? name,
    description: str(r.description),
    url,
    homepage: safeUrl(r.homepage),
    language,
    topics,
    stars: num(r.stargazers_count),
    forks: num(r.forks_count),
    watchers: num(r.watchers_count),
    openIssues: num(r.open_issues_count),
    createdAt: str(r.created_at) ?? new Date(0).toISOString(),
    updatedAt: str(r.updated_at) ?? new Date(0).toISOString(),
    pushedAt: str(r.pushed_at),
    isFork: r.fork === true,
    isArchived: r.archived === true,
    license: license === "NOASSERTION" ? null : license,
    categories: deriveCategories(language, topics, name),
    featured: (siteConfig.featuredRepos as readonly string[]).includes(name),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   PUBLIC API
   ═══════════════════════════════════════════════════════════════════════════ */

export async function getRepos(
  options: RequestOptions = {},
): Promise<GitHubResult<Repo[]>> {
  if (!isConfigured()) return { ok: false, error: NOT_CONFIGURED };

  const result = await request<unknown[]>(
    `/users/${encodeURIComponent(siteConfig.githubUsername)}/repos` +
      `?per_page=100&sort=pushed&direction=desc&type=owner`,
    options,
  );
  if (!result.ok) return result;
  if (!Array.isArray(result.data)) {
    return {
      ok: false,
      error: {
        kind: "unavailable",
        message: "Unexpected response from GitHub.",
      },
    };
  }

  const excluded = new Set(siteConfig.excludedRepos as readonly string[]);
  const featuredOrder = siteConfig.featuredRepos as readonly string[];

  const repos = result.data
    .map(normaliseRepo)
    .filter((r): r is Repo => r !== null)
    .filter((r) => !excluded.has(r.name))
    .filter((r) => siteConfig.includeForks || !r.isFork)
    .filter((r) => siteConfig.includeArchived || !r.isArchived)
    .sort((a, b) => {
      // Pinned repos first, in the order they were listed.
      const ai = featuredOrder.indexOf(a.name);
      const bi = featuredOrder.indexOf(b.name);
      if (ai !== -1 || bi !== -1) {
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      }
      // Then most recently pushed. Activity is the honest signal here.
      const at = new Date(a.pushedAt ?? a.updatedAt).getTime();
      const bt = new Date(b.pushedAt ?? b.updatedAt).getTime();
      return bt - at;
    });

  return { ok: true, data: repos };
}

export async function getProfile(
  options: RequestOptions = {},
): Promise<GitHubResult<Profile>> {
  if (!isConfigured()) return { ok: false, error: NOT_CONFIGURED };

  const result = await request<Record<string, unknown>>(
    `/users/${encodeURIComponent(siteConfig.githubUsername)}`,
    options,
  );
  if (!result.ok) return result;

  const u = result.data;
  const login = str(u.login);
  const htmlUrl = safeUrl(u.html_url);
  if (!login || !htmlUrl) {
    return {
      ok: false,
      error: {
        kind: "unavailable",
        message: "Unexpected response from GitHub.",
      },
    };
  }

  return {
    ok: true,
    data: {
      login,
      name: str(u.name),
      bio: str(u.bio),
      avatarUrl: safeUrl(u.avatar_url) ?? "",
      htmlUrl,
      publicRepos: num(u.public_repos),
      followers: num(u.followers),
      following: num(u.following),
      createdAt: str(u.created_at) ?? new Date(0).toISOString(),
      location: str(u.location),
      company: str(u.company),
      blog: safeUrl(u.blog),
    },
  };
}
