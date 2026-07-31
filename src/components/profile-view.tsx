"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Disc3Icon,
  StarIcon,
  UserCheckIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"
import { AlbumCard } from "@/components/album-card"
import { FollowButton } from "@/components/follow-button"
import { FollowListDialog } from "@/components/follow-list-dialog"
import { ProfileEditDialog } from "@/components/profile-edit-dialog"
import { StarRatingDisplay } from "@/components/star-rating-display"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getMoreFollowersAction, getMoreFollowingAction } from "@/lib/follow-actions"
import { formatRating } from "@/lib/format"
import type { FollowCounts } from "@/lib/follows"
import { resolveDisplayTag } from "@/lib/tag-utils"
import type { ProfileTag } from "@/lib/tags"
import type { Review, UserSummary } from "@/lib/types"

type ProfileUser = {
  id: string
  name?: string | null
  image?: string | null
  username?: string | null
  bio?: string | null
}

type ProfileViewProps = {
  user: ProfileUser
  reviews: Review[]
  // The single tag shown next to the name, already resolved server-side
  // (defaulted to "joined-<year>" if the user hasn't picked one - see
  // resolveDisplayTag in src/lib/tag-utils.ts).
  displayTag?: ProfileTag | null
  // Every tag the user has actually earned - only used to offer choices in
  // the edit dialog on their own profile.
  availableTags?: ProfileTag[]
  // Controls whether self-service CTAs (edit profile) are shown. Defaults to
  // true so the existing "my own profile" call site keeps working unchanged.
  isOwnProfile?: boolean
  followCounts: FollowCounts
  followers: UserSummary[]
  following: UserSummary[]
  // Whether the signed-in visitor already follows this profile - irrelevant
  // (and unused) when isOwnProfile is true.
  viewerIsFollowing?: boolean
}

export function ProfileView({
  user,
  reviews,
  displayTag = null,
  availableTags = [],
  isOwnProfile = true,
  followCounts,
  followers,
  following,
  viewerIsFollowing = false,
}: ProfileViewProps) {
  const router = useRouter()
  const [profile, setProfile] = useState({
    name: user.name ?? null,
    username: user.username ?? null,
    image: user.image ?? null,
    bio: user.bio ?? null,
  })
  const [tag, setTag] = useState(displayTag)
  const [followerCount, setFollowerCount] = useState(followCounts.followers)

  const average =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0

  const displayName = profile.name ?? profile.username ?? "Discows listener"
  const initials = displayName.slice(0, 2).toUpperCase()

  function handleProfileUpdated(patch: {
    name?: string
    username?: string
    bio?: string
    displayTagKey?: string | null
  }) {
    setProfile((current) => ({
      ...current,
      ...patch,
      bio: patch.bio !== undefined ? patch.bio || null : current.bio,
    }))
    if (patch.displayTagKey !== undefined) {
      setTag(resolveDisplayTag(availableTags, patch.displayTagKey))
    }
    // The URL for this page is /profile/[username], so renaming needs to
    // update it too - otherwise refreshing the page would 404 on the old one.
    if (patch.username && patch.username !== user.username) {
      router.replace(`/profile/${patch.username}`)
    }
  }

  function handleFollowerCountChange(delta: 1 | -1) {
    setFollowerCount((current) => Math.max(0, current + delta))
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Identity: photo, name, username, bio, and the edit/follow action -
          Instagram-style, but tuned for a listener profile instead of posts. */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-row items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            {/* A gradient ring stands in for the banner as the bit of visual
                flair here, instead of relying on a user-uploaded photo. */}
            <div className="rounded-full bg-gradient-to-br from-primary via-primary/60 to-primary/20 p-[3px] shadow-lg shadow-primary/10">
              <Avatar className="size-20 ring-4 ring-background sm:size-24">
                {profile.image ? (
                  <AvatarImage src={profile.image} alt={displayName} />
                ) : null}
                <AvatarFallback className="text-2xl sm:text-3xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="font-heading text-xl tracking-tight sm:text-2xl">
                {profile.username ? `@${profile.username}` : displayName}
              </span>
              {profile.username && profile.name ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground sm:text-base">
                    {profile.name}
                  </span>
                  {tag ? (
                    <Badge variant="secondary" className="font-normal text-muted-foreground">
                      {tag.label}
                    </Badge>
                  ) : null}
                </div>
              ) : tag ? (
                <Badge variant="secondary" className="w-fit font-normal text-muted-foreground">
                  {tag.label}
                </Badge>
              ) : null}

              {/* Instagram-style counts: just the number and the label, a
                  small icon alongside instead of a big card. */}
              <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1.5">
                <StatInline icon={Disc3Icon} value={String(reviews.length)} label="Albums" />
                <StatInline
                  icon={StarIcon}
                  value={reviews.length ? formatRating(average) : "—"}
                  label="Avg rating"
                />
                <FollowListDialog
                  title="Followers"
                  users={followers}
                  loadMore={(offset) => getMoreFollowersAction(user.id, offset)}
                  emptyMessage={
                    isOwnProfile ? "No followers yet." : `${displayName} has no followers yet.`
                  }
                >
                  <StatInline icon={UsersIcon} value={String(followerCount)} label="Followers" />
                </FollowListDialog>
                <FollowListDialog
                  title="Following"
                  users={following}
                  loadMore={(offset) => getMoreFollowingAction(user.id, offset)}
                  emptyMessage={
                    isOwnProfile
                      ? "You aren't following anyone yet."
                      : `${displayName} isn't following anyone yet.`
                  }
                >
                  <StatInline
                    icon={UserCheckIcon}
                    value={String(followCounts.following)}
                    label="Following"
                  />
                </FollowListDialog>
              </div>
            </div>
          </div>

          {isOwnProfile ? (
            <ProfileEditDialog
              name={profile.name}
              username={profile.username}
              bio={profile.bio}
              availableTags={availableTags}
              selectedTagId={tag?.id ?? null}
              onUpdated={handleProfileUpdated}
            />
          ) : (
            <FollowButton
              targetUserId={user.id}
              initialFollowing={viewerIsFollowing}
              onFollowerCountChange={handleFollowerCountChange}
            />
          )}
        </div>

        {profile.bio ? (
          <p className="max-w-prose text-sm whitespace-pre-line text-muted-foreground italic sm:text-base">
            {profile.bio}
          </p>
        ) : null}
      </section>

      {/* Albums: the main event. */}
      {reviews.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Disc3Icon />
            </EmptyMedia>
            <EmptyTitle>
              {isOwnProfile ? "Your catalog is empty" : "No albums yet"}
            </EmptyTitle>
            <EmptyDescription>
              {isOwnProfile
                ? "Rate an album to start building your profile."
                : `${displayName} hasn't reviewed any albums yet.`}
            </EmptyDescription>
          </EmptyHeader>
          {isOwnProfile ? (
            <EmptyContent>
              <Button render={<Link href="/library" />} nativeButton={false}>
                Search albums
              </Button>
            </EmptyContent>
          ) : null}
        </Empty>
      ) : (
        <Tabs defaultValue="grid">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-semibold tracking-tight sm:text-xl">
              Albums
              <span className="ml-2 font-sans text-sm font-normal text-muted-foreground">
                {reviews.length}
              </span>
            </h2>
            <TabsList>
              <TabsTrigger value="grid">Grid</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="grid" className="pt-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {reviews.map((review) => (
                <AlbumCard
                  key={review.spotifyId}
                  album={{
                    id: review.spotifyId,
                    name: review.albumName,
                    artists: review.artists,
                    releaseDate: review.releaseDate ?? review.listenedAt.slice(0, 4),
                    totalTracks: 0,
                    imageUrl: review.imageUrl,
                    spotifyUrl: `https://open.spotify.com/album/${review.spotifyId}`,
                  }}
                  rating={review.rating}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="list" className="pt-4">
            <ul className="flex flex-col divide-y rounded-xl border">
              {reviews.map((review) => (
                <li key={review.spotifyId}>
                  <Link
                    href={`/album/${review.spotifyId}`}
                    className="flex items-start gap-4 p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{review.albumName}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {review.artists.join(", ")}
                      </p>
                      {review.text ? (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {review.text}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StarRatingDisplay value={review.rating} size="sm" />
                      <span className="text-xs text-muted-foreground">
                        {formatRating(review.rating)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

type StatInlineProps = {
  icon: LucideIcon
  value: string
  label: string
}

// Just the number and the label, Instagram-style - a small icon alongside
// instead of the boxed card this used to be.
function StatInline({ icon: Icon, value, label }: StatInlineProps) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm">
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="font-heading font-bold tracking-tight">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  )
}
