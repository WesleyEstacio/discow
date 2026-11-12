import { Badge } from "@/components/ui/badge"
import { POST_STATUS_LABELS, type PostStatus } from "@/lib/studio/post-status"
import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<PostStatus, string> = {
  idea: "border-border text-muted-foreground",
  draft: "border-border",
  in_review: "border-amber-400/40 text-amber-300",
  approved: "border-emerald-400/40 text-emerald-300",
  scheduled: "border-sky-400/40 text-sky-300",
  published: "border-primary/50 text-primary",
}

export function PostStatusBadge({ status }: { status: PostStatus }) {
  return (
    <Badge variant="outline" className={cn(STATUS_STYLES[status])}>
      {POST_STATUS_LABELS[status]}
    </Badge>
  )
}
