import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Disc3Icon, ExternalLinkIcon } from "lucide-react"
import { ReviewForm } from "@/components/review-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatDuration, formatReleaseYear } from "@/lib/format"
import { getAlbum } from "@/lib/spotify"

type AlbumPageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: AlbumPageProps): Promise<Metadata> {
  const { id } = await params

  try {
    const album = await getAlbum(id)
    return {
      title: album.name,
      description: `${album.name} by ${album.artists.join(", ")}`,
    }
  } catch {
    return { title: "Album" }
  }
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { id } = await params

  let album: Awaited<ReturnType<typeof getAlbum>>

  try {
    album = await getAlbum(id)
  } catch {
    notFound()
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10">
      <section className="grid gap-8 md:grid-cols-[240px_1fr] md:items-start">
        <div className="relative mx-auto aspect-square w-full max-w-60 overflow-hidden rounded-xl bg-muted md:mx-0">
          {album.imageUrl ? (
            <Image
              src={album.imageUrl}
              alt={`${album.name} cover`}
              fill
              priority
              sizes="240px"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <Disc3Icon className="size-12" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">Album</p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              {album.name}
            </h1>
            <p className="text-lg text-muted-foreground">
              {album.artists.join(", ")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {formatReleaseYear(album.releaseDate)}
            </Badge>
            <Badge variant="outline">
              {album.totalTracks} track{album.totalTracks === 1 ? "" : "s"}
            </Badge>
            {album.label ? <Badge variant="outline">{album.label}</Badge> : null}
            {album.genres.map((genre) => (
              <Badge key={genre} variant="outline">
                {genre}
              </Badge>
            ))}
          </div>

          <div>
            <Button
              render={
                <a href={album.spotifyUrl} target="_blank" rel="noreferrer" />
              }
              nativeButton={false}
              variant="outline"
              size="sm"
            >
              <ExternalLinkIcon data-icon="inline-start" />
              Open in Spotify
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-xl font-medium">Tracklist</h2>
          <Separator />
          <ol className="flex flex-col">
            {album.tracks.map((track) => (
              <li
                key={track.id}
                className="flex items-center gap-3 border-b py-3 last:border-b-0"
              >
                <span className="w-8 shrink-0 text-sm text-muted-foreground">
                  {track.trackNumber}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{track.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {track.artists.join(", ")}
                  </p>
                </div>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {formatDuration(track.durationMs)}
                </span>
              </li>
            ))}
          </ol>
          {album.tracks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tracks available for this release.
            </p>
          ) : null}
        </section>

        <ReviewForm album={album} />
      </div>

      <p className="text-sm text-muted-foreground">
        <Link href="/search" className="underline-offset-4 hover:underline">
          Back to search
        </Link>
      </p>
    </main>
  )
}
