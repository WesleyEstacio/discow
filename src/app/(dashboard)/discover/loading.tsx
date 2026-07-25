import { Skeleton } from "@/components/ui/skeleton"

export default function DiscoverLoading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <div className="flex max-w-2xl flex-col gap-3">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-full max-w-lg" />
      </div>
      <Skeleton className="h-64 w-full max-w-xl rounded-xl" />
    </main>
  )
}
