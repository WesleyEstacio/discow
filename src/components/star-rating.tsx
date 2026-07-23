"use client"

import { StarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type StarRatingProps = {
  value: number
  onChange?: (value: number) => void
  max?: number
  size?: "sm" | "md" | "lg"
  readOnly?: boolean
  className?: string
}

const sizeClass = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
}

export function StarRating({
  value,
  onChange,
  max = 5,
  size = "md",
  readOnly = false,
  className,
}: StarRatingProps) {
  const stars = Array.from({ length: max }, (_, index) => index + 1)
  const interactive = Boolean(onChange) && !readOnly

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role={interactive ? "radiogroup" : "img"}
      aria-label={interactive ? "Rating" : `${value} out of ${max} stars`}
    >
      {stars.map((star) => {
        const fillAmount = Math.max(0, Math.min(1, value - (star - 1)))
        const isHalf = fillAmount > 0 && fillAmount < 1
        const isFull = fillAmount >= 1

        return (
          <span key={star} className="relative inline-flex">
            {interactive ? (
              <>
                <button
                  type="button"
                  className="absolute inset-y-0 left-0 z-10 w-1/2"
                  aria-label={`${star - 0.5} stars`}
                  onClick={() => onChange?.(star - 0.5)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 z-10 w-1/2"
                  aria-label={`${star} stars`}
                  onClick={() => onChange?.(star)}
                />
              </>
            ) : null}
            <StarIcon
              aria-hidden
              className={cn(
                sizeClass[size],
                "text-muted-foreground/40",
                interactive && "cursor-pointer"
              )}
            />
            {(isFull || isHalf) && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 overflow-hidden"
                style={{ width: `${fillAmount * 100}%` }}
              >
                <StarIcon
                  className={cn(sizeClass[size], "fill-foreground text-foreground")}
                />
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}
