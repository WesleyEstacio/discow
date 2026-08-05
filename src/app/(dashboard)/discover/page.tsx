import type { Metadata } from "next"
import { auth } from "@/auth"
import { DiscoverExperience } from "@/components/discover/discover-experience"
import {
  appendAccountDiscoverHistoryEntry,
  getAccountDiscoverHistory,
  rollDiscoverAlbum,
} from "@/lib/discover-server"
import type { DiscoverHistoryEntry } from "@/lib/discover"

export const metadata: Metadata = {
  title: "Discover",
  description:
    "Roll the dice for a new album pick and browse every album Discover has shown you on Discows.",
  alternates: { canonical: "/discover" },
}

const NO_FILTERS = { genre: null, decadeStartYear: null }

// Signed-in listeners get their Discover history from the database (see
// discover_pick in src/lib/db/schema.ts) instead of the browser, so it
// follows them across devices. A Server Component can write to the database
// directly (unlike a guest's localStorage, which only the client can
// touch), so a first-ever visit rolls and saves one pick in the same pass
// here instead of needing a client-side bootstrap effect - see
// DiscoverExperience for the guest equivalent of that effect.
async function resolveAccountHistory(
  userId: string
): Promise<{ history: DiscoverHistoryEntry[]; bootstrapError: string | null }> {
  const history = await getAccountDiscoverHistory(userId)
  if (history.length > 0) return { history, bootstrapError: null }

  try {
    const result = await rollDiscoverAlbum(NO_FILTERS, [])
    const entry: DiscoverHistoryEntry = {
      album: result.album,
      genreLabel: result.genreLabel,
      roll: result.roll,
    }
    await appendAccountDiscoverHistoryEntry(userId, entry)
    return { history: [entry], bootstrapError: null }
  } catch (error) {
    return {
      history: [],
      bootstrapError: error instanceof Error ? error.message : "Failed to load Discover",
    }
  }
}

export default async function DiscoverPage() {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return <DiscoverExperience isSignedIn={false} />
  }

  const { history, bootstrapError } = await resolveAccountHistory(userId)

  return (
    <DiscoverExperience
      isSignedIn
      initialHistory={history}
      initialBootstrapError={bootstrapError}
    />
  )
}
