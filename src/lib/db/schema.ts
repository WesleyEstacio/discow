import type { AdapterAccountType } from "next-auth/adapters"
import type { PostLanguage, PostStatus } from "@/lib/studio/post-status"
import type { StudioSlide } from "@/lib/studio/slides"
import type { UserRole } from "@/lib/user-role"
import {
  boolean,
  index,
  integer,
  jsonb,
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
  // "admin" unlocks the Discows Studio (see src/lib/studio/admin.ts).
  role: text("role").$type<UserRole>().notNull().default("user"),
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
    // How many tracks the reviewed release has on Spotify - denormalized at
    // review time just like albumName/artists above. Backs the album/track
    // split in profile stats (see resolveReleaseKind() in
    // src/lib/release-kind.ts): more than 1 track counts as an album, exactly
    // 1 counts as a track. Nullable only for rows written before this column
    // existed - see scripts/backfill-review-total-tracks.mjs - and treated as
    // an album (the pre-existing behavior) until backfilled.
    totalTracks: integer("total_tracks"),
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
// Up to MAX_FAVORITE_ALBUMS (src/lib/favorite-constants.ts) rows per user -
// the "Favorite albums" section on the profile (src/components/profile-
// view.tsx). Album fields are denormalized straight onto the row, same
// choice as `review`/`discover_pick` above, so a favorite doesn't depend on
// a review existing for that album. (userId, spotifyId) is unique so
// favoriting the same album twice is a safe no-op instead of a duplicate
// row.
export const favoriteAlbums = pgTable(
  "favorite_album",
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
    totalTracks: integer("total_tracks"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (favoriteAlbum) => [
    unique("favorite_album_user_album_unique").on(
      favoriteAlbum.userId,
      favoriteAlbum.spotifyId
    ),
    index("favorite_album_user_id_created_at_idx").on(
      favoriteAlbum.userId,
      favoriteAlbum.createdAt
    ),
  ]
)

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

// Discows Studio (src/app/(studio)): internal, admin-only tables for planning
// and exporting Instagram carousels. Kept apart from the listener-facing
// tables above - nothing here is ever read by a public page or endpoint.

export type StudioAlbumSource = "spotify" | "musicbrainz" | "manual"
export type StudioCoverSource = "spotify" | "cover-art-archive" | "custom"

// The reusable music library. (externalSource, externalId) is unique so
// saving the same Spotify/MusicBrainz release twice updates nothing instead
// of creating a duplicate; manual entries have no externalId and are never
// deduplicated. Fields an API didn't return stay null for manual filling
// rather than being guessed.
export const studioAlbums = pgTable(
  "studio_album",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    artistNames: text("artist_names").array().notNull(),
    releaseYear: integer("release_year"),
    coverImageUrl: text("cover_image_url"),
    coverSource: text("cover_source").$type<StudioCoverSource>(),
    dominantColorHex: text("dominant_color_hex"),
    genres: text("genres").array().notNull().default([]),
    tags: text("tags").array().notNull().default([]),
    editorialDescription: text("editorial_description").notNull().default(""),
    editorialNotes: text("editorial_notes").notNull().default(""),
    spotifyUrl: text("spotify_url"),
    externalSource: text("external_source").$type<StudioAlbumSource>().notNull(),
    externalId: text("external_id"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (studioAlbum) => [
    unique("studio_album_external_unique").on(
      studioAlbum.externalSource,
      studioAlbum.externalId
    ),
    index("studio_album_created_at_idx").on(studioAlbum.createdAt),
  ]
)

// One Instagram carousel. Slides live in a jsonb column (validated by
// studioSlidesSchema in src/lib/studio/slides.ts) because the editor always
// reads and saves the whole carousel at once; albumIds mirrors the albums
// the slides use so the overview can list recently used albums cheaply.
export const studioPosts = pgTable(
  "studio_post",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    templateKey: text("template_key").notNull(),
    status: text("status").$type<PostStatus>().notNull().default("draft"),
    language: text("language").$type<PostLanguage>().notNull().default("pt"),
    settings: jsonb("settings").$type<Record<string, string>>().notNull().default({}),
    slides: jsonb("slides").$type<StudioSlide[]>().notNull(),
    albumIds: text("album_ids").array().notNull().default([]),
    caption: text("caption").notNull().default(""),
    notes: text("notes").notNull().default(""),
    scheduledFor: timestamp("scheduled_for", { mode: "date" }),
    publishedAt: timestamp("published_at", { mode: "date" }),
    createdByUserId: text("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (studioPost) => [
    index("studio_post_status_idx").on(studioPost.status),
    index("studio_post_scheduled_for_idx").on(studioPost.scheduledFor),
    index("studio_post_updated_at_idx").on(studioPost.updatedAt),
  ]
)
