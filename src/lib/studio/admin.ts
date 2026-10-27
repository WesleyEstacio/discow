import "server-only"
import { notFound } from "next/navigation"
import { auth } from "@/auth"

export type StudioAdmin = {
  userId: string
  email: string
}

function readAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  )
}

export function isStudioAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return readAdminEmails().has(email.toLowerCase())
}

export async function getStudioAdmin(): Promise<StudioAdmin | null> {
  const session = await auth()
  const userId = session?.user?.id
  const email = session?.user?.email

  if (!userId || !email || !isStudioAdminEmail(email)) return null
  return { userId, email }
}

// 404 instead of 403 so non-admins can't even tell the Studio exists.
// Must be called by every Studio page, Server Action and Route Handler -
// a check in the layout alone doesn't protect actions or API routes.
export async function requireStudioAdmin(): Promise<StudioAdmin> {
  const admin = await getStudioAdmin()
  if (!admin) notFound()
  return admin
}
