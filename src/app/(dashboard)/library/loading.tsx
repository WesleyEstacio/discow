import { Skeleton } from "@/components/ui/skeleton"

export default function LibraryLoading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-10">
      <section className="flex flex-col gap-6">
        <div className="flex max-w-2xl flex-col gap-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-5 w-full max-w-lg" />
        </div>
        <Skeleton className="h-9 w-full max-w-xl" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-28" />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="aspect-square w-full rounded-xl" />
          ))}
        </div>
      </section>
    </main>
  )
}
