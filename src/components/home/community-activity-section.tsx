import Image from "next/image"
import Link from "next/link"
import { Suspense } from "react"
import { Disc3Icon } from "lucide-react"
import { StarRatingDisplay } from "@/components/star-rating-display"
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
import { cn } from "@/lib/utils"

const COMMUNITY_ACTIVITY_LIMIT = 3

// Keeps the mobile slider looking like a carousel instead of a plain
// scroll box - the drag/swipe affordance is enough of a hint on touch
// devices without a visible scrollbar track.
const SCROLLBAR_HIDDEN_CLASS_NAME =
  "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"

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
    <div
      className={cn(
        // Below `sm`, this is a horizontally swiping slider (most recent
        // activity first) instead of a stacked column, since these cards are
        // dense enough that one per row wastes a lot of vertical space.
        "-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1",
        SCROLLBAR_HIDDEN_CLASS_NAME,
        "sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3"
      )}
    >
      {activity.map((item) => (
        <div
          key={`${item.spotifyId}-${item.updatedAt}`}
          className={cn(
            // `min-w-0` matters here: without it, a long album/reviewer name
            // forces this card (and the grid track around it) wider than the
            // viewport instead of letting the `truncate`/`line-clamp` text
            // below actually clip.
            "flex min-w-0 shrink-0 basis-[85%] snap-start flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground",
            "sm:shrink sm:basis-auto"
          )}
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
                    className="font-medium underline-offset-2 transition-colors hover:text-primary-glow hover:underline"
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

          <StarRatingDisplay value={item.rating} size="sm" />

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
    <div
      className={cn(
        "-mx-4 flex gap-4 overflow-x-hidden px-4 pb-1",
        "sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 sm:pb-0 lg:grid-cols-3"
      )}
    >
      {Array.from({ length: COMMUNITY_ACTIVITY_LIMIT }).map((_, index) => (
        <div
          key={index}
          className="flex min-w-0 shrink-0 basis-[85%] flex-col gap-3 rounded-xl border bg-card p-4 sm:shrink sm:basis-auto"
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
