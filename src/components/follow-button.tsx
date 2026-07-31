"use client"

import { useState, useTransition } from "react"
import { UserMinusIcon, UserPlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { followUserAction, unfollowUserAction } from "@/lib/follow-actions"

export type FollowButtonProps = {
  targetUserId: string
  initialFollowing: boolean
  // Lets the parent keep its follower count in sync without refetching -
  // called with +1/-1 whenever the toggle round-trips successfully.
  onFollowerCountChange?: (delta: 1 | -1) => void
}

export function FollowButton({
  targetUserId,
  initialFollowing,
  onFollowerCountChange,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    // Optimistic flip - reverted below if the server disagrees.
    const nextFollowing = !following
    setFollowing(nextFollowing)

    startTransition(async () => {
      const result = nextFollowing
        ? await followUserAction(targetUserId)
        : await unfollowUserAction(targetUserId)

      if (!result.success) {
        setFollowing(!nextFollowing)
        toast.add({
          title: nextFollowing ? "Could not follow" : "Could not unfollow",
          description: result.error,
          type: "error",
        })
        return
      }

      onFollowerCountChange?.(nextFollowing ? 1 : -1)
    })
  }

  return (
    <Button
      type="button"
      variant={following ? "outline" : "default"}
      size="sm"
      disabled={isPending}
      onClick={handleClick}
    >
      {following ? (
        <>
          <UserMinusIcon data-icon="inline-start" />
          Following
        </>
      ) : (
        <>
          <UserPlusIcon data-icon="inline-start" />
          Follow
        </>
      )}
    </Button>
  )
}
