import Link from "next/link"
import { CalendarDaysIcon } from "lucide-react"
import { PostCoverThumbnail } from "@/components/studio/post-cover-thumbnail"
import { PostRowActions } from "@/components/studio/post-row-actions"
import { PostStatusBadge } from "@/components/studio/post-status-badge"
import { formatStudioDate, formatStudioDateTime } from "@/lib/studio/labels"
import type { PostCover } from "@/lib/studio/post-covers"
import { POST_LANGUAGE_LABELS } from "@/lib/studio/post-status"
import type { StudioPostSummary } from "@/lib/studio/posts"
import { findTemplateName } from "@/lib/studio/templates"

const CARD_COVER_WIDTH = 176

export function PostCard({ post, cover }: { post: StudioPostSummary; cover: PostCover | undefined }) {
  return (
    <li className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/25">
      <div className="p-3 pb-0">
        <div className="flex h-60 items-center justify-center rounded-lg bg-muted/40">
          <PostCoverThumbnail
            cover={cover}
            width={CARD_COVER_WIDTH}
            className="transition-transform duration-300 ease-out group-hover:-translate-y-1 motion-reduce:transition-none"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-col gap-1">
          <h2 className="line-clamp-2 font-heading text-base font-semibold leading-snug tracking-tight">
            <Link
              href={`/studio/posts/${post.id}`}
              className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
            >
              {post.title}
            </Link>
          </h2>
          <p className="text-sm text-muted-foreground">
            {findTemplateName(post.templateKey)} · {post.slideCount} slides · {POST_LANGUAGE_LABELS[post.language]}
          </p>
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-2">
          <PostStatusBadge status={post.status} />
          {post.scheduledFor ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
              <CalendarDaysIcon className="size-3.5" aria-hidden="true" />
              {formatStudioDate(post.scheduledFor)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between gap-2 border-t border-border py-2 pr-2 pl-5">
        <span className="text-xs text-muted-foreground tabular-nums">Editada {formatStudioDateTime(post.updatedAt)}</span>
        <PostRowActions postId={post.id} postTitle={post.title} />
      </div>
    </li>
  )
}
