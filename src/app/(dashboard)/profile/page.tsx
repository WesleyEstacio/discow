import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { ensureUsername } from "@/lib/username"

// "/profile" is just an entry point that bounces the signed-in user to their
// own public profile at "/profile/[username]" - that's the one canonical URL
// for a profile, whether you're viewing your own or someone else's.
export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/library?callbackUrl=/profile")
  }

  const username =
    session.user.username ?? (await ensureUsername(session.user.id, session.user.name))

  redirect(`/profile/${username}`)
}
