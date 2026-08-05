import { NextResponse } from "next/server"
import { auth } from "@/auth"
import type { DiscoverFilters } from "@/lib/discover"
import { appendAccountDiscoverHistoryEntry, rollDiscoverAlbum } from "@/lib/discover-server"
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit"

type RollRequestBody = {
  filters?: Partial<DiscoverFilters>
  excludeIds?: unknown
}

function parseFilters(raw: Partial<DiscoverFilters> | undefined): DiscoverFilters {
  return {
    genre: typeof raw?.genre === "string" && raw.genre.trim() ? raw.genre.trim() : null,
    decadeStartYear:
      typeof raw?.decadeStartYear === "number" && Number.isFinite(raw.decadeStartYear)
        ? raw.decadeStartYear
        : null,
  }
}

function parseExcludeIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((id): id is string => typeof id === "string").slice(0, 200)
}

// Called both to roll the very first pick on a fresh visit (empty history)
// and every time the listener clicks "Surprise Me". Discover history for
// guests lives in the browser (see src/lib/discover.ts) - the client sends
// its own history ids as `excludeIds` so a fresh roll never repeats one of
// them. Signed-in listeners get the same treatment, but this route also
// saves the result to their account (discover_pick table) so it follows
// them across devices - see src/lib/discover-server.ts.
export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, { key: "discover:roll", limit: 30 })
  if (!rateLimit.success) return rateLimitExceededResponse(rateLimit.resetAt)

  let body: RollRequestBody
  try {
    body = (await request.json()) as RollRequestBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const filters = parseFilters(body.filters)
  const excludeIds = parseExcludeIds(body.excludeIds)

  try {
    const result = await rollDiscoverAlbum(filters, excludeIds)

    const session = await auth()
    const userId = session?.user?.id
    if (userId) {
      await appendAccountDiscoverHistoryEntry(userId, {
        album: result.album,
        genreLabel: result.genreLabel,
        roll: result.roll,
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to roll a new album"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
