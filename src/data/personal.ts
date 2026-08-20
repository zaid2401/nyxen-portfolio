/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PERSONAL
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The story behind the name, shown in the hidden archive (`sudo nyxen --secret`
 * in the shell).
 *
 * This file is EMPTY BY DESIGN and only you can fill it. Everything else on this
 * site is derived from work history, repositories or code — facts that can be
 * checked. This cannot be, so it is not guessable, and inventing a plausible
 * origin story would be exactly the kind of fabrication the rest of the project
 * refuses to do.
 *
 * The only consumer treats it as optional: while `whyNyxen` is null the archive
 * keeps its "only the author can write this" panel. The site is complete
 * without it.
 */

export interface Personal {
  /** The origin of the handle, in a sentence or two. */
  whyNyxen: string | null;
}

export const personal: Personal = {
  // TODO(you): the story behind the name.
  whyNyxen: null,
};
