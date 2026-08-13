"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Disc3Icon,
  LayoutGridIcon,
  ListIcon,
  Music2Icon,
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { getMoreFollowersAction, getMoreFollowingAction } from "@/lib/follow-actions"
import { formatRating } from "@/lib/format"
import type { FollowCounts } from "@/lib/follows"
import { resolveReleaseKind } from "@/lib/release-kind"
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
  // Grid vs. list is a display preference, not tied to which kind of
  // release is showing - one ToggleGroup drives both the Albums and Tracks
  // tabs below instead of each tab having its own.
  const [view, setView] = useState<"grid" | "list">("grid")

  // Split by release kind (see resolveReleaseKind() in
  // src/lib/release-kind.ts) so the header - and the tabs further down -
  // show albums and tracks separately instead of one combined list.
  const albumReviews = reviews.filter(
    (review) => resolveReleaseKind(review.totalTracks) === "album"
  )
  const trackReviews = reviews.filter(
    (review) => resolveReleaseKind(review.totalTracks) === "track"
  )

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
                <StatInline icon={Disc3Icon} value={String(albumReviews.length)} label="Albums" />
                <StatInline icon={Music2Icon} value={String(trackReviews.length)} label="Tracks" />
                <FollowListDialog
                  title="Cows"
                  users={followers}
                  loadMore={(offset) => getMoreFollowersAction(user.id, offset)}
                  emptyMessage={
                    isOwnProfile ? "No Cows yet." : `${displayName} has no Cows yet.`
                  }
                >
                  <StatInline icon={UsersIcon} value={String(followerCount)} label="Cows" />
                </FollowListDialog>
                <FollowListDialog
                  title="Herd"
                  users={following}
                  loadMore={(offset) => getMoreFollowingAction(user.id, offset)}
                  emptyMessage={
                    isOwnProfile
                      ? "You don't have a Herd yet."
                      : `${displayName} doesn't have a Herd yet.`
                  }
                >
                  <StatInline
                    icon={UserCheckIcon}
                    value={String(followCounts.following)}
                    label="Herd"
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
        <Tabs defaultValue="albums">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList>
              <TabsTrigger value="albums">
                Albums
                <span className="ml-1.5 font-sans text-xs font-normal text-muted-foreground">
                  {albumReviews.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="tracks">
                Tracks
                <span className="ml-1.5 font-sans text-xs font-normal text-muted-foreground">
                  {trackReviews.length}
                </span>
              </TabsTrigger>
            </TabsList>
            {/* Grid vs. list is shared across both tabs above (see the `view`
                state) - switching it here keeps whichever tab is open. */}
            <ToggleGroup
              variant="outline"
              size="sm"
              value={[view]}
              onValueChange={(values) => {
                const next = values[0]
                if (next === "grid" || next === "list") setView(next)
              }}
              aria-label="Layout"
            >
              <ToggleGroupItem value="grid" aria-label="Grid view">
                <LayoutGridIcon />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <ListIcon />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <TabsContent value="albums" className="pt-4">
            <ReviewsTabPanel
              reviews={albumReviews}
              view={view}
              emptyMessage={
                isOwnProfile
                  ? "You haven't rated any albums yet."
                  : `${displayName} hasn't rated any albums yet.`
              }
            />
          </TabsContent>
          <TabsContent value="tracks" className="pt-4">
            <ReviewsTabPanel
              reviews={trackReviews}
              view={view}
              emptyMessage={
                isOwnProfile
                  ? "You haven't rated any tracks yet."
                  : `${displayName} hasn't rated any tracks yet.`
              }
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

type ReviewsTabPanelProps = {
  reviews: Review[]
  view: "grid" | "list"
  emptyMessage: string
}

// One tab's worth of reviews (either all-albums or all-tracks, decided by
// the caller) - shows a short empty message instead of the grid/list when
// this particular kind is empty, so an account with only albums doesn't see
// a blank Tracks tab with no explanation.
function ReviewsTabPanel({ reviews, view, emptyMessage }: ReviewsTabPanelProps) {
  if (reviews.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return view === "grid" ? <ReviewsGrid reviews={reviews} /> : <ReviewsList reviews={reviews} />
}

function ReviewsGrid({ reviews }: { reviews: Review[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {reviews.map((review) => (
        <AlbumCard
          key={review.spotifyId}
          album={{
            id: review.spotifyId,
            name: review.albumName,
            artists: review.artists,
            releaseDate: review.releaseDate ?? review.listenedAt.slice(0, 4),
            totalTracks: review.totalTracks ?? 0,
            imageUrl: review.imageUrl,
            spotifyUrl: `https://open.spotify.com/album/${review.spotifyId}`,
          }}
          rating={review.rating}
        />
      ))}
    </div>
  )
}

function ReviewsList({ reviews }: { reviews: Review[] }) {
  return (
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
