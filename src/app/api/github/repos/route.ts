import { getRepos } from "@/lib/github";
import { isDev } from "@/lib/utils";

/**
 * Client-side entry point for repository data.
 *
 * The Projects section is server-rendered, so this route exists purely for the
 * "Retry" action in the error state. It runs on the server, which is what keeps
 * `GITHUB_TOKEN` out of the browser bundle: the client never talks to
 * api.github.com directly.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const fresh = new URL(request.url).searchParams.get("fresh") === "1";
  const result = await getRepos({ fresh });

  if (!result.ok) {
    const status =
      result.error.kind === "rate-limited"
        ? 429
        : result.error.kind === "not-found"
          ? 404
          : result.error.kind === "not-configured"
            ? 501
            : 502;

    return Response.json(
      {
        ok: false,
        error: {
          kind: result.error.kind,
          message: result.error.message,
          // Setup guidance is for the author, not for visitors.
          ...(isDev && result.error.hint ? { hint: result.error.hint } : {}),
        },
      },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(
    { ok: true, repos: result.data },
    { headers: { "Cache-Control": "no-store" } },
  );
}
