import "server-only"
import { eq } from "drizzle-orm"
import { cache } from "react"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"

export type PublicUser = {
  id: string
  name: string | null
  username: string
  image: string | null
  createdAt: Date
}

// Wrapped in React's cache() because both generateMetadata and the page
// component look up the same username on every request - this dedupes that
// into a single DB round trip per render instead of two.
export const getUserByUsername = cache(
  async (username: string): Promise<PublicUser | null> => {
    const row = await db.query.users.findFirst({
      where: eq(users.username, username),
    })

    if (!row?.username) return null

    return {
      id: row.id,
      name: row.name,
      username: row.username,
      image: row.image,
      createdAt: row.createdAt,
    }
  }
)
