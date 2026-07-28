import { StarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type StarRatingDisplayProps = {
  value: number
  max?: number
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClass = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
}

// Read-only rendering of a star rating, as a plain Server Component. Pages
// that only ever display a rating (album cards, community activity,
// profiles) render this instead of the interactive `StarRating` in
// star-rating.tsx, so they don't ship that client component's JS just to
// show static stars.
export function StarRatingDisplay({
  value,
  max = 5,
  size = "md",
  className,
}: StarRatingDisplayProps) {
  const stars = Array.from({ length: max }, (_, index) => index + 1)

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${value} out of ${max} stars`}
    >
      {stars.map((star) => {
        const fillAmount = Math.max(0, Math.min(1, value - (star - 1)))
        const isHalf = fillAmount > 0 && fillAmount < 1
        const isFull = fillAmount >= 1

        return (
          <span key={star} className="relative inline-flex">
            <StarIcon aria-hidden className={cn(sizeClass[size], "text-muted-foreground/40")} />
            {isFull || isHalf ? (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 overflow-hidden"
                style={{ width: `${fillAmount * 100}%` }}
              >
                <StarIcon className={cn(sizeClass[size], "fill-foreground text-foreground")} />
              </span>
            ) : null}
          </span>
        )
      })}
    </div>
  )
}
