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
