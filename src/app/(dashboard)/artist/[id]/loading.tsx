import { Skeleton } from "@/components/ui/skeleton"

export default function ArtistLoading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10">
      <section className="grid gap-8 md:grid-cols-[240px_1fr] md:items-start">
        <Skeleton className="mx-auto aspect-square w-full max-w-60 rounded-full md:mx-0" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-8 w-full max-w-xs" />
        </div>
      </section>
      <Skeleton className="h-72 w-full rounded-xl" />
      <Skeleton className="h-56 w-full rounded-xl" />
    </main>
  )
}
