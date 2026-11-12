import { Badge } from "@/components/ui/badge"
import { TEMPLATE_TAG_LABELS, type TemplateTag } from "@/lib/studio/template-tags"
import { cn } from "@/lib/utils"

const TAG_STYLES: Record<TemplateTag, string> = {
  ready: "border-emerald-400/40 text-emerald-300",
  in_development: "border-sky-400/40 text-sky-300",
  in_review: "border-amber-400/40 text-amber-300",
  postponed: "border-orange-400/40 text-orange-300",
  idea: "border-border text-muted-foreground",
}

export function TemplateTagBadge({ tag }: { tag: TemplateTag | null }) {
  if (!tag) {
    return (
      <Badge variant="outline" className="border-dashed text-muted-foreground">
        Sem tag
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className={cn(TAG_STYLES[tag])}>
      {TEMPLATE_TAG_LABELS[tag]}
    </Badge>
  )
}
