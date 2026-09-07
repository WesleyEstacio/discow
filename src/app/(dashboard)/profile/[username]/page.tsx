import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { ProfileView } from "@/components/profile-view"
import { getFavoriteAlbums } from "@/lib/favorites"
import { getFollowCounts, getFollowers, getFollowing, isFollowing } from "@/lib/follows"
import { getReviewsForUser } from "@/lib/reviews"
import { resolveArtistIdsByAlbumId } from "@/lib/spotify"
import { resolveDisplayTag } from "@/lib/tag-utils"
import { getProfileTags } from "@/lib/tags"
import type { FavoriteAlbum, Review } from "@/lib/types"
import { getUserByUsername } from "@/lib/users"

type PublicProfilePageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: PublicProfilePageProps): Promise<Metadata> {
  const { username } = await params
  const profileUser = await getUserByUsername(username)

  if (!profileUser) {
    return { title: "Profile" }
  }

  const displayName = profileUser.name ?? profileUser.username
  const description = `See the albums ${displayName} has rated and reviewed on Discows.`

  return {
    title: displayName,
    description,
    alternates: { canonical: `/profile/${profileUser.username}` },
    openGraph: {
      title: displayName,
      description,
      images: profileUser.image ? [{ url: profileUser.image }] : undefined,
    },
  }
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { username } = await params
  // Neither of these depends on the other, so they run concurrently instead
  // of one waiting on the other.
  const [profileUser, session] = await Promise.all([getUserByUsername(username), auth()])

  if (!profileUser) {
    notFound()
  }

  const isOwnProfile = session?.user?.id === profileUser.id
  // Independent of each other, so they run concurrently.
  const [
    reviews,
    favorites,
    availableTags,
    followCounts,
    followers,
    following,
    viewerIsFollowing,
  ] = await Promise.all([
    getReviewsForUser(profileUser.id),
    getFavoriteAlbums(profileUser.id),
    getProfileTags(profileUser.id),
    getFollowCounts(profileUser.id),
    getFollowers(profileUser.id),
    getFollowing(profileUser.id),
    isOwnProfile ? Promise.resolve(false) : isFollowing(session?.user?.id, profileUser.id),
  ])

  const displayTag = resolveDisplayTag(availableTags, profileUser.displayTagKey)

  // Reviews and favorites only ever denormalize the artist *name* (see
  // ROADMAP.md), so this resolves each distinct album's real Spotify artist
  // ids (one live lookup per unique album, cached 5 minutes - see
  // resolveArtistIdsByAlbumId in src/lib/spotify.ts) purely so the profile
  // can link the artist credit to /artist/[id]. Capped to the most recently
  // updated reviews (getReviewsForUser already orders newest-first) rather
  // than every review an account has ever written - a heavy reviewer could
  // otherwise turn one profile visit into hundreds of parallel Spotify
  // calls. Reviews past the cap simply keep showing a plain-text artist
  // name instead of a link, same graceful fallback as anywhere else this
  // lookup can't resolve.
  const PROFILE_ARTIST_LINK_LIMIT = 40
  const artistIdsByAlbumId = await resolveArtistIdsByAlbumId([
    ...reviews.slice(0, PROFILE_ARTIST_LINK_LIMIT).map((review) => review.spotifyId),
    ...favorites.map((favorite) => favorite.spotifyId),
  ])
  const reviewsWithArtistIds: Review[] = reviews.map((review) => ({
    ...review,
    artistIds: artistIdsByAlbumId[review.spotifyId],
  }))
  const favoritesWithArtistIds: FavoriteAlbum[] = favorites.map((favorite) => ({
    ...favorite,
    artistIds: artistIdsByAlbumId[favorite.spotifyId],
  }))

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <ProfileView
        user={profileUser}
        reviews={reviewsWithArtistIds}
        favorites={favoritesWithArtistIds}
        displayTag={displayTag}
        availableTags={availableTags}
        isOwnProfile={isOwnProfile}
        followCounts={followCounts}
        followers={followers}
        following={following}
        viewerIsFollowing={viewerIsFollowing}
      />
    </main>
  )
}
