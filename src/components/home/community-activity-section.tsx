import Image from "next/image"
import Link from "next/link"
import { Suspense } from "react"
import { Disc3Icon } from "lucide-react"
import { StarRating } from "@/components/star-rating"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { formatRelativeTime } from "@/lib/format"
import { getRecentCommunityActivity } from "@/lib/home"

const COMMUNITY_ACTIVITY_LIMIT = 3

// Static header renders immediately; Suspense only wraps the list that has
// to wait on the database.
export function CommunityActivitySection() {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-xl font-medium">Community activity</h2>
        <p className="text-sm text-muted-foreground">
          Recent reviews from Discows listeners.
        </p>
      </div>
      <Suspense fallback={<CommunityActivityListSkeleton />}>
        <CommunityActivityList />
      </Suspense>
    </section>
  )
}

async function CommunityActivityList() {
  const activity = await getRecentCommunityActivity(COMMUNITY_ACTIVITY_LIMIT)

  if (activity.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>No activity yet</EmptyTitle>
          <EmptyDescription>
            Reviews written by the community will show up here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {activity.map((item) => (
        <div
          key={`${item.spotifyId}-${item.updatedAt}`}
          className="flex flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground"
        >
          <div className="flex items-center gap-3">
            <Avatar size="sm">
              {item.reviewerImage ? (
                <AvatarImage src={item.reviewerImage} alt={item.reviewerName} />
              ) : null}
              <AvatarFallback>
                {item.reviewerName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">
                {item.reviewerUsername ? (
                  <Link
                    href={`/profile/${item.reviewerUsername}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {item.reviewerName}
                  </Link>
                ) : (
                  <span className="font-medium">{item.reviewerName}</span>
                )}{" "}
                <span className="text-muted-foreground">
                  reviewed {item.albumName}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(item.updatedAt)}
              </p>
            </div>
          </div>

          <Link
            href={`/album/${item.spotifyId}`}
            className="flex items-center gap-3 rounded-lg outline-none transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt=""
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <Disc3Icon className="size-5" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.albumName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {item.artists.join(", ")}
              </p>
            </div>
          </Link>

          <StarRating value={item.rating} size="sm" readOnly />

          <p className="line-clamp-3 text-sm text-muted-foreground">
            {item.reviewText}
          </p>
        </div>
      ))}
    </div>
  )
}

export function CommunityActivityListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: COMMUNITY_ACTIVITY_LIMIT }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 rounded-xl border bg-card p-4"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="size-6 rounded-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
    </div>
  )
}
