import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PublicProfileNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col items-start gap-4 px-4 py-16">
      <h1 className="font-heading text-2xl font-semibold">User not found</h1>
      <p className="text-muted-foreground">
        No Discows profile exists at this username.
      </p>
      <Button render={<Link href="/library" />} nativeButton={false}>
        Back to library
      </Button>
    </main>
  )
}
