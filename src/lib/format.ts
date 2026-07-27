export function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export function formatReleaseYear(releaseDate: string) {
  return releaseDate.slice(0, 4)
}

export function formatRating(rating: number) {
  return rating % 1 === 0 ? rating.toFixed(0) : rating.toFixed(1)
}

const RELATIVE_TIME_DIVISIONS: {
  amountInUnit: number
  unit: Intl.RelativeTimeFormatUnit
}[] = [
  { amountInUnit: 60, unit: "second" },
  { amountInUnit: 60, unit: "minute" },
  { amountInUnit: 24, unit: "hour" },
  { amountInUnit: 7, unit: "day" },
  { amountInUnit: 4.34524, unit: "week" },
  { amountInUnit: 12, unit: "month" },
  { amountInUnit: Number.POSITIVE_INFINITY, unit: "year" },
]

const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
})

/**
 * Formats a date as a short relative string ("2h ago", "3d ago"), stepping
 * through second/minute/hour/day/week/month/year until it finds the largest
 * unit that still rounds to less than one of the next unit.
 */
export function formatRelativeTime(dateInput: string | Date) {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput
  let durationInUnit = (Date.now() - date.getTime()) / 1000

  for (const division of RELATIVE_TIME_DIVISIONS) {
    if (Math.abs(durationInUnit) < division.amountInUnit) {
      return relativeTimeFormatter.format(-Math.round(durationInUnit), division.unit)
    }
    durationInUnit /= division.amountInUnit
  }

  return relativeTimeFormatter.format(0, "second")
}
