import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { ProfileView } from "@/components/profile-view"
import { getFollowCounts, getFollowers, getFollowing, isFollowing } from "@/lib/follows"
import { getReviewsForUser } from "@/lib/reviews"
import { resolveDisplayTag } from "@/lib/tag-utils"
import { getProfileTags } from "@/lib/tags"
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
  const [reviews, availableTags, followCounts, followers, following, viewerIsFollowing] =
    await Promise.all([
      getReviewsForUser(profileUser.id),
      getProfileTags(profileUser.id),
      getFollowCounts(profileUser.id),
      getFollowers(profileUser.id),
      getFollowing(profileUser.id),
      isOwnProfile ? Promise.resolve(false) : isFollowing(session?.user?.id, profileUser.id),
    ])

  const displayTag = resolveDisplayTag(availableTags, profileUser.displayTagKey)

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <ProfileView
        user={profileUser}
        reviews={reviews}
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
