import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AlbumNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col items-start gap-4 px-4 py-16">
      <h1 className="font-heading text-2xl font-semibold">Album not found</h1>
      <p className="text-muted-foreground">
        This album could not be loaded from Spotify.
      </p>
      <Button render={<Link href="/search" />} nativeButton={false}>
        Back to search
      </Button>
    </main>
  )
}
