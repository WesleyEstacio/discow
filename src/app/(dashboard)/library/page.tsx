import type { Metadata } from "next"
import { auth } from "@/auth"
import { LibrarySearch } from "@/components/library-search"
import { LibrarySignInDialog } from "@/components/library-signin-dialog"
import { CommunityActivitySection } from "@/components/home/community-activity-section"
import { DiscowsPicksSection } from "@/components/home/discows-picks-section"
import { NewReleasesSection } from "@/components/home/new-releases-section"
import { PopularAlbumsSection } from "@/components/home/popular-albums-section"

export const metadata: Metadata = {
  title: "Library",
}

type LibraryPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const session = await auth()
  const { callbackUrl } = await searchParams
  const firstName = session?.user?.name?.split(" ")[0]

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-10">
      <section className="flex flex-col items-center gap-6 text-center">
        <div className="flex max-w-2xl flex-col gap-2">
          <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            {firstName ? `Welcome, ${firstName}!` : "Welcome to Discows!"}
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Discover what&apos;s happening on Discows today.
          </p>
        </div>
        <div className="w-full max-w-xl">
          <LibrarySearch autoFocus />
        </div>
      </section>

      <NewReleasesSection />

      <PopularAlbumsSection />

      <CommunityActivitySection />

      <DiscowsPicksSection />

      <LibrarySignInDialog
        isAuthenticated={Boolean(session?.user)}
        callbackUrl={callbackUrl}
      />
    </main>
  )
}
