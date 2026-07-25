import { Skeleton } from "@/components/ui/skeleton"

export default function SearchLoading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <div className="flex max-w-2xl flex-col gap-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-full max-w-md" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, index) => (
          <Skeleton key={index} className="aspect-square w-full rounded-xl" />
        ))}
      </div>
    </main>
  )
}
