import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema"
import { ensureUsername } from "@/lib/username"

// The Auth.js `AdapterUser` type doesn't know about our custom `username`
// column, even though the Drizzle adapter reads it from the database - so we
// read it off with a small local cast instead of fighting the library types.
function readUsername(user: object): string | null {
  const value = (user as { username?: unknown }).username
  return typeof value === "string" ? value : null
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [Google],
  pages: {
    signIn: "/library",
  },
  session: {
    strategy: "database",
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id
      session.user.username = readUsername(user)
      return session
    },
  },
  events: {
    // Fires once, right after the adapter creates the row for a brand-new
    // account.
    async createUser({ user }) {
      if (user.id) await ensureUsername(user.id, user.name)
    },
    // Fires on every sign-in (including the first one, right after
    // createUser above). Backfills a username for accounts that existed
    // before this feature shipped; a no-op for everyone else since
    // ensureUsername only touches rows with no username yet.
    async signIn({ user }) {
      if (user.id) await ensureUsername(user.id, user.name)
    },
  },
})
