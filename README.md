# NYXEN — developer portfolio

A dark, terminal-flavoured portfolio for **Zaid** (Nyxen) — software and automation developer, moving toward software development and data engineering.

The distinguishing feature is that the **Projects section maintains itself**. It reads the GitHub REST API at build time and on a revalidation window, so pushing a new public repository puts it on the site with no code change and no deploy.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Framer Motion and Lucide.

---

## Contents

- [Quick start](#quick-start)
- [Configure it as yours](#configure-it-as-yours)
- [Environment variables](#environment-variables)
- [How the GitHub integration works](#how-the-github-integration-works)
- [Commands](#commands)
- [Project structure](#project-structure)
- [Deploying to Vercel](#deploying-to-vercel)
- [Custom domain](#custom-domain)
- [Design and engineering notes](#design-and-engineering-notes)
- [Accessibility](#accessibility)
- [Easter eggs](#easter-eggs)

---

## Quick start

Requires Node.js 20 or newer.

```bash
npm install
```

```bash
npm run dev
```

Then open <http://localhost:3000>.

The site runs with no environment variables at all. Everything degrades honestly: with no GitHub username configured, the Projects section shows a clear "not linked" state rather than fake repositories.

---

## Configure it as yours

**One file: [`src/config/site.ts`](src/config/site.ts).** Nothing else in the codebase hardcodes your identity or links.

```ts
export const siteConfig = {
  brand: "NYXEN",
  name: "Zaid",
  githubUsername: "‹your-github-username›", // ← set this first
  email: "‹your.email@example.com›",
  linkedin: "https://www.linkedin.com/in/‹your-linkedin-slug›",
  // …
};
```

Any value still containing the `‹ ›` guillemets is treated as a **placeholder**. In development those render with an amber `TODO` badge so you can spot them; in production the badge is compiled out. Search the project for `‹` to find everything that still needs replacing.

Longer-form content lives in three data files, each with a header comment explaining what to change:

| File | Drives |
| --- | --- |
| [`src/data/experience.ts`](src/data/experience.ts) | The Work and Education timelines, the About panel rows, and the About prose |
| [`src/data/skills.ts`](src/data/skills.ts) | The technology constellation, its edges, and how skills match repositories |

### Dates are computed, not typed

Work and education entries take a `start` and an `end`. Everything shown is
derived from that pair — the range label, the duration, and whether the role is
current. There is no separate flag that can fall out of sync:

```ts
start: "2024-07",  end: "2026-07"   // Jul 2024 — Jul 2026 · 2 yr 1 mo
start: "2024-07",  end: "present"   // Jul 2024 — Present  · 2 yr 2 mo  + CURRENT
start: "2021",     end: "2024"      // 2021 — 2024         · 4 yr
```

Accepted formats: `2024-07`, `Jul 2024`, `July 2024`, `2024`, and for an ongoing
role any of `present` / `current` / `now` / `ongoing`.

The "2+ years" figure on the About panel is the total across all work entries,
with overlapping roles counted once. See [`src/lib/duration.ts`](src/lib/duration.ts).

> **On invented content:** nothing on this site is fabricated. Any value still wrapped in `‹ ›` is an unfilled placeholder and is flagged as such in development. Where an API genuinely has no data — a repo with no description, no topics, no licence — the UI says so rather than filling the gap.

---

## Environment variables

Copy the example file and fill in what you need. Both variables are optional — the site builds and runs without either.

```bash
cp .env.example .env.local
```

`.env.local` is git-ignored and must never be committed. `.env.example` contains placeholders only and **is** committed.

| Variable | Required | Purpose |
| --- | --- | --- |
| `GITHUB_TOKEN` | No | Raises the API limit from 60 to 5,000 requests/hour. Only matters if you rebuild often. |
| `NEXT_PUBLIC_SITE_URL` | No | Overrides `siteConfig.url` for absolute metadata URLs. |

None of these are secrets in the browser: every one is read server-side only. `GITHUB_TOKEN` is never prefixed `NEXT_PUBLIC_`, never returned in an API payload, and lives in a module that client components cannot import (see [below](#the-serverclient-split)).

### GitHub token

Create a fine-grained token at <https://github.com/settings/tokens?type=beta> with **no account permissions** — read-only public access is enough. Do not grant repository write scopes.

### Contact

There is no contact form, on purpose. A form needs an email provider and a
verified sending domain behind it to be anything more than decoration, and a
form that quietly drops messages is worse than no form. The Contact section
offers a `mailto:` with a pre-filled subject plus one-click copy — the message
gets sent just as fast, and there is nothing to break, no key to rotate and no
API route to secure.

If you later own a domain and want a real form, add an email provider
(Resend, Postmark, SES), a `POST /api/contact` route handler, and gate the form
on the provider's credentials being present so it never renders without a
working delivery path.

---

## How the GitHub integration works

```
GitHub REST API
      │
      └─ /users/:login/repos ──────────┐   src/lib/github.ts   (server only)
                                       │   ├─ validates every field
                                       ├──▶├─ derives filter categories
                                       │   └─ returns a typed Result, never throws
                                       │
                              src/app/page.tsx  (ISR, revalidate 3600)
                                       │
                              ┌────────┴────────┐
                         Projects             Skills
                   (Suspense + skeleton)  (skill → repo links)
```

**Auto-update.** `src/app/page.tsx` exports `revalidate = 3600`. The page is prerendered, and the first request after the window expires triggers a background regeneration that re-reads GitHub. Push `github.com/<you>/new-project` and it shows up on its own. Change the window in `siteConfig.revalidateSeconds` — and keep the literal in `page.tsx` in step, since Next requires that export to be a static value.

**Filter categories are derived, not maintained.** `deriveCategories()` in [`src/lib/github-shared.ts`](src/lib/github-shared.ts) maps a repository's primary language and topics onto Python / Java / Kotlin / Automation / Data / AWS / Web / Other. Only categories with at least one repository are shown, with live counts. Tag a repo `rpa` or `aws` on GitHub and it files itself.

**Skills link to real repositories.** Each skill in `src/data/skills.ts` carries a `match` block of languages and topics; selecting a node lists the public repositories that actually match. No manual project-to-skill mapping exists.

**Failure is designed for.** Every function returns a discriminated `GitHubResult` and never throws. Rate limiting, a wrong username, a missing token, a network failure and an empty account each get their own state with plain-language copy and a working **Retry** — which re-fetches through `/api/github/repos`, server-side, so the browser still never touches the GitHub API directly. Raw upstream errors are never shown; setup hints appear in development only.

---

## Commands

```bash
npm run dev
```

```bash
npm run build
```

```bash
npm run lint
```

```bash
npm run typecheck
```

```bash
npm run format
```

`npm run start` serves a production build locally. `npm run format:check` and `npm run lint:fix` are also available.

---

## Project structure

```
src/
├── app/
│   ├── layout.tsx              Fonts, metadata, JSON-LD, pre-hydration script
│   ├── page.tsx                Section composition + ISR window
│   ├── globals.css             Design tokens, base layer, custom utilities
│   ├── icon.svg                Favicon
│   ├── opengraph-image.tsx     Generated social card
│   ├── twitter-image.tsx       Re-exports the OG card
│   ├── sitemap.ts / robots.ts
│   └── api/
│       └── github/repos/       Retry endpoint for Projects
├── components/
│   ├── boot/                   Boot sequence
│   ├── navigation/             Header, mobile sheet, ⌘K palette
│   ├── hero/                   Hero + canvas node field
│   ├── about/ experience/ projects/ skills/
│   ├── terminal/               Shell + command registry
│   ├── contact/ footer/
│   ├── system/                 Provider, DOM-backed store, cursor, dev HUD
│   └── ui/                     Section, Panel, Dialog, Reveal, buttons, emblem
├── hooks/                      Media queries, active section, konami, platform
├── lib/
│   ├── github.ts               Server-only fetching (reads process.env)
│   ├── github-shared.ts        Types + pure logic (safe for the client)
│   ├── duration.ts             Period parsing, durations, total experience
│   ├── languages.ts utils.ts navigation.ts
├── config/site.ts              ← the only file you must edit
└── data/                       experience · skills
```

---

## Deploying to Vercel

1. Push the repository to GitHub.
2. Import it at <https://vercel.com/new>. The framework is detected automatically; no build settings need changing.
3. Add `GITHUB_TOKEN` under **Settings → Environment Variables** if you want the higher rate limit. It is optional — the site builds and runs without it.
4. Deploy.

`npm run build` must pass before you deploy; it currently does, with zero TypeScript and zero ESLint errors.

## Custom domain

The intended production domain is **nyxen.website**, already set as `siteConfig.url` and used for canonical, Open Graph and sitemap URLs.

1. In Vercel: **Project → Settings → Domains → Add**, enter `nyxen.website`.
2. At your registrar, follow the records Vercel shows — usually an `A` record for the apex to Vercel's IP, and a `CNAME` for `www` to `cname.vercel-dns.com`.
3. Wait for DNS to propagate; Vercel issues the TLS certificate automatically.
4. Set `www` to redirect to the apex (or the reverse) so only one canonical host is indexed.

If you deploy somewhere other than `nyxen.website`, change `siteConfig.url` or set `NEXT_PUBLIC_SITE_URL` — otherwise the canonical tag will point at a domain you don't control.

---

## Design and engineering notes

### Why there is no Three.js

Three.js and React Three Fiber were considered for the hero field and the skills constellation, and deliberately left out. The hero is a flat network of points and lines, which a 2D canvas draws well; the constellation needs focusable, labelled nodes, which are better as real HTML buttons over an SVG. Adding a WebGL renderer would have cost hundreds of kilobytes to do those two jobs worse. The dependency list is short on purpose.

### The server/client split

`src/lib/github.ts` reads `process.env` and performs network calls. Client components never import it — they import `src/lib/github-shared.ts`, which holds the types and the pure logic (category derivation, activity summary, skill-to-repo matching) and has no environment access. That split is what keeps the server module, and anything it touches, out of the browser bundle.

### Rendering

Server components by default. Only what genuinely needs the browser is a client component: the canvas field, the filters, the dialogs, the terminal, the palette. Both GitHub sections sit behind `<Suspense>` with real skeletons, so the page shell paints without waiting on the API.

### Performance

The hero canvas stops on an `IntersectionObserver` when scrolled away and on `visibilitychange` in a background tab; device pixel ratio is capped at 2; node count and link radius drop on small screens. Card tilt and cursor glow write to CSS custom properties in a `pointermove` handler rather than React state, so moving the mouse across the project grid causes no re-renders. Both fonts are self-hosted by `next/font` with the latin subset only.

### Motion

One flag, `motionEnabled`, is the product of the visitor's effects preference and `prefers-reduced-motion`. Every animated component reads it, so no component can accidentally ignore the OS setting. The preference is stored on `<html>` as a data attribute — written by a tiny pre-hydration script and read through `useSyncExternalStore` — which is also what stops the boot overlay flashing for a returning visitor.

### A note on `--color-base`

Do not add a Tailwind colour token named `base`, `sm`, `lg` and so on. In Tailwind v4 a `--color-<name>` token registers `text-<name>` as a *colour* utility, which shadows the built-in `text-base` font size and silently repaints body copy. The ground tones here are named for depth (`void`, `sunk`, `raised`, `panel`) for exactly this reason.

---

## Accessibility

- Semantic landmarks; every section is labelled by its heading
- Skip-to-content link, visible focus rings everywhere, no colour-only state
- Command palette implements the combobox/listbox pattern with `aria-activedescendant`; the lifecycle rail is a real tablist with roving tabindex; dialogs trap Tab, close on Escape and restore focus
- The boot sequence is skippable by button or key and is not mounted at all under reduced motion
- Reduced motion is honoured globally in CSS and per-component in JS
- No horizontal page scroll from 320px upward; wide content scrolls inside its own container

---

## Easter eggs

Four, all reversible and none of them in the way:

1. **Konami code** (↑↑↓↓←→←→ B A) — opens a small live telemetry read-out. Escape closes it.
2. **Five clicks on the NYXEN emblem** — reboots the interface and replays the boot sequence.
3. **`sudo` in the terminal, three times** — you are not in the sudoers file, but persistence is rewarded.
4. **`nyxen` in the terminal** — prints the banner.

---

Built with curiosity & code.
