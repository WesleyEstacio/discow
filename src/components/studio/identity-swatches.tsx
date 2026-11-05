import { SLIDE_BACKGROUNDS } from "@/lib/studio/slides"
import { findVisualIdentity, identitySwatchColors } from "@/lib/studio/visual-identities"
import { cn } from "@/lib/utils"

export function IdentitySwatches({ identityKey, className }: { identityKey: string; className?: string }) {
  const identity = findVisualIdentity(identityKey)
  if (!identity) return null

  return (
    <span className={cn("mt-0.5 flex shrink-0 -space-x-1.5", className)} aria-hidden="true">
      {identitySwatchColors(identity).map((backgroundKey) => (
        <span
          key={backgroundKey}
          className="size-4 rounded-full border border-border"
          style={{ backgroundColor: SLIDE_BACKGROUNDS[backgroundKey].background }}
        />
      ))}
    </span>
  )
}
