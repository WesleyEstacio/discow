import Link from "next/link"
import { Suspense } from "react"
import type { Metadata } from "next"
import { auth } from "@/auth"
import { SearchForm } from "@/components/search-form"
import { RecentReviews } from "@/components/recent-reviews"
import { LibrarySignInDialog } from "@/components/library-signin-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Library",
}

type LibraryPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const session = await auth()
  const { callbackUrl } = await searchParams

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-10">
      <section className="flex flex-col gap-6">
        <div className="flex max-w-2xl flex-col gap-3">
          <p className="text-sm font-medium text-muted-foreground">Discows</p>
          <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            Catalog the albums you love.
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Search Spotify, rate with stars, write reviews, and discover new
            albums based on what you already love.
          </p>
        </div>
        <div className="max-w-xl">
          <SearchForm autoFocus />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button render={<Link href="/discover" />} nativeButton={false}>
            Discover albums
          </Button>
          <Button render={<Link href="/search" />} nativeButton={false} variant="outline">
            Browse search
          </Button>
          <Button render={<Link href="/profile" />} nativeButton={false} variant="ghost">
            Open profile
          </Button>
        </div>
      </section>

      <Suspense fallback={<RecentReviewsSkeleton />}>
        <RecentReviews />
      </Suspense>

      <LibrarySignInDialog
        isAuthenticated={Boolean(session?.user)}
        callbackUrl={callbackUrl}
      />
    </main>
  )
}

function RecentReviewsSkeleton() {
  return (
    <section className="flex flex-col gap-4">
      <Skeleton className="h-6 w-40" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="aspect-square w-full rounded-xl" />
        ))}
      </div>
    </section>
  )
}
