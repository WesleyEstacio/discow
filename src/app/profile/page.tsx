import type { Metadata } from "next"
import { ProfileView } from "@/components/profile-view"

export const metadata: Metadata = {
  title: "Profile",
}

export default function ProfilePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <ProfileView />
    </main>
  )
}
