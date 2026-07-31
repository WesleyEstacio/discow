"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Disc3Icon, StarIcon, type LucideIcon } from "lucide-react"
import { AlbumCard } from "@/components/album-card"
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
import { formatRating } from "@/lib/format"
import type { ProfileTag } from "@/lib/tags"
import type { Review } from "@/lib/types"

type ProfileUser = {
  name?: string | null
  image?: string | null
  username?: string | null
}

type ProfileViewProps = {
  user: ProfileUser
  reviews: Review[]
  // Rule-based badges (join year, "first users", ...) - see src/lib/tags.ts.
  // Optional so existing call sites don't have to be updated all at once.
  tags?: ProfileTag[]
  // Controls whether self-service CTAs (edit profile) are shown. Defaults to
  // true so the existing "my own profile" call site keeps working unchanged.
  isOwnProfile?: boolean
}

export function ProfileView({
  user,
  reviews,
  tags = [],
  isOwnProfile = true,
}: ProfileViewProps) {
  const router = useRouter()
  const [profile, setProfile] = useState({
    name: user.name ?? null,
    username: user.username ?? null,
    image: user.image ?? null,
  })

  const average =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0

  const displayName = profile.name ?? profile.username ?? "Discows listener"
  const initials = displayName.slice(0, 2).toUpperCase()

  function handleProfileUpdated(patch: { name?: string; username?: string }) {
    setProfile((current) => ({ ...current, ...patch }))
    // The URL for this page is /profile/[username], so renaming needs to
    // update it too - otherwise refreshing the page would 404 on the old one.
    if (patch.username && patch.username !== user.username) {
      router.replace(`/profile/${patch.username}`)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Identity: everything you need at a glance - avatar, @handle, tags,
          and the edit action - no banner, no photography required. */}
      <section className="flex flex-row items-center justify-between gap-4">
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
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="font-normal text-muted-foreground"
                  >
                    {tag.label}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {isOwnProfile ? (
          <ProfileEditDialog
            name={profile.name}
            username={profile.username}
            onUpdated={handleProfileUpdated}
          />
        ) : null}
      </section>

      {/* Stats get real visual weight here - this is the info that matters
          most about a listener. */}
      <div className="grid grid-cols-2 gap-4 sm:max-w-sm">
        <StatCard icon={Disc3Icon} value={String(reviews.length)} label="Albums" />
        <StatCard
          icon={StarIcon}
          value={reviews.length ? formatRating(average) : "—"}
          label="Avg rating"
        />
      </div>

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

type StatCardProps = {
  icon: LucideIcon
  value: string
  label: string
}

function StatCard({ icon: Icon, value, label }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-4 text-card-foreground shadow-sm">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="truncate font-heading text-2xl font-bold tracking-tight">
          {value}
        </span>
        <span className="truncate text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}
