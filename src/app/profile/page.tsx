import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { ProfileView } from "@/components/profile-view"
import { getReviewsForUser } from "@/lib/reviews"

export const metadata: Metadata = {
  title: "Profile",
}

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/profile")
  }

  const reviews = await getReviewsForUser(session.user.id)

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <ProfileView user={session.user} reviews={reviews} />
    </main>
  )
}
