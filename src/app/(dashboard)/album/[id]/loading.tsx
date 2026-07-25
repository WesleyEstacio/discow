import { Skeleton } from "@/components/ui/skeleton"

export default function AlbumLoading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10">
      <section className="grid gap-8 md:grid-cols-[240px_1fr] md:items-start">
        <Skeleton className="mx-auto aspect-square w-full max-w-60 rounded-xl md:mx-0" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-6 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </section>
      <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
        <Skeleton className="h-96 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </main>
  )
}
