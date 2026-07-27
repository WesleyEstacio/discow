import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { ProfileView } from "@/components/profile-view"
import { getReviewsForUser } from "@/lib/reviews"
import { getUserByUsername } from "@/lib/users"

type PublicProfilePageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: PublicProfilePageProps): Promise<Metadata> {
  const { username } = await params
  const profileUser = await getUserByUsername(username)

  return { title: profileUser ? `${profileUser.name ?? profileUser.username}` : "Profile" }
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { username } = await params
  const profileUser = await getUserByUsername(username)

  if (!profileUser) {
    notFound()
  }

  const session = await auth()
  const isOwnProfile = session?.user?.id === profileUser.id
  const reviews = await getReviewsForUser(profileUser.id)

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <ProfileView
        user={profileUser}
        reviews={reviews}
        isOwnProfile={isOwnProfile}
      />
    </main>
  )
}
