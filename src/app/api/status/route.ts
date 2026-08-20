import { checkStatus } from "@/lib/status";

/**
 * Client entry point for a status re-check.
 *
 * The panel is server-rendered with its first values already in place, so this
 * route exists purely for the "Recheck" button. The checks themselves live in
 * `src/lib/status.ts` and are shared with that server render — one
 * implementation, so the two can never report different things.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await checkStatus(), {
    headers: { "Cache-Control": "no-store" },
  });
}
