import type { AdapterAccountType } from "next-auth/adapters"
import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core"

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  // Auto-generated from the user's name on account creation (see
  // src/lib/username.ts) and editable afterwards (see
  // src/lib/profile-actions.ts). Nullable only so it can be safely added to
  // existing rows via migration - ensureUsername/updateProfileAction never
  // let it be set back to null once assigned.
  username: text("username").unique(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  // Short free-text blurb shown on the public profile (see
  // src/components/profile-view.tsx). Nullable - most accounts won't set one.
  bio: text("bio"),
  // Which of the user's earned tags (see user_tag / src/lib/tags.ts) to show
  // next to their name. Null means "use the default" (the joined-<year>
  // tag) - see resolveDisplayTag() in src/lib/tags.ts. Not a foreign key
  // since user_tag's key isn't unique on its own (it's per-user), so this is
  // validated against the user's actual tags in updateProfileAction instead.
  displayTagKey: text("display_tag_key"),
  // Backs the "Joined in <year>" profile tag (see src/lib/tags.ts). Existing
  // rows get backfilled to the migration's run date, so pre-launch accounts
  // are all treated as one early cohort.
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
})

export const accounts = pgTable(
  "account",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ]
)

export const sessions = pgTable("session", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable(
  "verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ]
)

export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credential_id").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("provider_account_id").notNull(),
    credentialPublicKey: text("credential_public_key").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credential_device_type").notNull(),
    credentialBackedUp: boolean("credential_backed_up").notNull(),
    transports: text("transports"),
  },
  (authenticator) => [
    primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  ]
)

// Profile badges (see src/lib/tags.ts): stored, not recomputed on every
// request. "joined-<year>" is assigned automatically on first sign-in
// (auth.ts). Others - like "first-users" - are added by hand for now (e.g.
// via `npm run db:studio`), until there's an admin UI or achievement system
// to manage them. (userId, key) is the primary key, so re-inserting the same
// tag for a user is a safe no-op instead of a duplicate row.
export const userTags = pgTable(
  "user_tag",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    label: text("label").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (userTag) => [
    primaryKey({ columns: [userTag.userId, userTag.key] }),
  ]
)

// Social graph backing the "Followers"/"Following" counts and Follow button
// on the profile (see src/lib/follows.ts). A row means followerId follows
// followingId. (followerId, followingId) as the primary key makes following
// someone twice a safe no-op instead of a duplicate row.
export const follows = pgTable(
  "follow",
  {
    followerId: text("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (follow) => [
    primaryKey({ columns: [follow.followerId, follow.followingId] }),
  ]
)

export const reviews = pgTable(
  "review",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    spotifyId: text("spotify_id").notNull(),
    albumName: text("album_name").notNull(),
    artists: text("artists").array().notNull(),
    imageUrl: text("image_url"),
    releaseDate: text("release_date"),
    rating: real("rating").notNull(),
    reviewText: text("review_text").notNull().default(""),
    listenedAt: timestamp("listened_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (review) => [
    unique("review_user_album_unique").on(review.userId, review.spotifyId),
  ]
)

// One row per album Discover has rolled for a signed-in listener (see
// src/lib/discover-server.ts). Album fields are denormalized straight onto
// the row - same choice as `review` above - so rendering a listener's
// Discover history never needs a Spotify lookup, even if the album is later
// removed from Spotify's catalogue. Guests get the same history, but kept
// client-side (localStorage, see src/lib/discover.ts) instead of here, since
// there's no account to key it by.
export const discoverPicks = pgTable(
  "discover_pick",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    spotifyId: text("spotify_id").notNull(),
    albumName: text("album_name").notNull(),
    artists: text("artists").array().notNull(),
    imageUrl: text("image_url"),
    releaseDate: text("release_date"),
    spotifyUrl: text("spotify_url").notNull(),
    // What the roll that found this album actually landed on - always the
    // real album's own genre/decade, not just the filters that were locked
    // when it was rolled. See rollDiscoverAlbum() in discover-server.ts.
    genre: text("genre").notNull(),
    decadeStartYear: integer("decade_start_year").notNull(),
    artist: text("artist"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (discoverPick) => [
    index("discover_pick_user_id_created_at_idx").on(
      discoverPick.userId,
      discoverPick.createdAt
    ),
  ]
)
