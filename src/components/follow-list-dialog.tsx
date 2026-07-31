"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FOLLOW_LIST_PAGE_SIZE } from "@/lib/follow-constants"
import type { UserSummary } from "@/lib/types"

export type FollowListDialogProps = {
  title: string
  // The first page, already fetched server-side alongside the rest of the
  // profile.
  users: UserSummary[]
  emptyMessage: string
  // Fetches the page starting at `offset` - a page shorter than
  // FOLLOW_LIST_PAGE_SIZE (including empty) means there's nothing left.
  loadMore: (offset: number) => Promise<UserSummary[]>
  // The clickable stat (e.g. "238 Followers") that opens the dialog.
  children: React.ReactNode
}

export function FollowListDialog({
  title,
  users: initialUsers,
  emptyMessage,
  loadMore,
  children,
}: FollowListDialogProps) {
  const [open, setOpen] = useState(false)
  const [users, setUsers] = useState(initialUsers)
  const [hasMore, setHasMore] = useState(initialUsers.length >= FOLLOW_LIST_PAGE_SIZE)
  const [isPending, startTransition] = useTransition()

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen) {
      // Reset to the server-provided first page every time it's reopened, so
      // "load more" progress from a previous visit doesn't linger stale.
      setUsers(initialUsers)
      setHasMore(initialUsers.length >= FOLLOW_LIST_PAGE_SIZE)
    }
  }

  function handleLoadMore() {
    startTransition(async () => {
      const nextPage = await loadMore(users.length)
      setUsers((current) => [...current, ...nextPage])
      setHasMore(nextPage.length >= FOLLOW_LIST_PAGE_SIZE)
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger className="inline-flex cursor-pointer rounded-md outline-none hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/50">
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {users.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          <ScrollArea className="-mx-4 max-h-80 px-4">
            <ul className="flex flex-col gap-1">
              {users.map((user) => (
                <li key={user.id}>
                  <DialogClose
                    render={
                      <Link
                        href={`/profile/${user.username}`}
                        className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                      />
                    }
                  >
                    <Avatar size="sm">
                      {user.image ? (
                        <AvatarImage src={user.image} alt={user.name ?? user.username} />
                      ) : null}
                      <AvatarFallback>
                        {(user.name ?? user.username).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col leading-tight">
                      <span className="truncate text-sm font-medium">
                        {user.name ?? user.username}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        @{user.username}
                      </span>
                    </div>
                  </DialogClose>
                </li>
              ))}
            </ul>

            {hasMore ? (
              <div className="flex justify-center pt-2 pb-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={handleLoadMore}
                >
                  {isPending ? "Loading…" : "Load more"}
                </Button>
              </div>
            ) : null}
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
