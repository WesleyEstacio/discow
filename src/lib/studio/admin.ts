import "server-only"
import { eq, sql } from "drizzle-orm"
import { notFound } from "next/navigation"
import type { Session } from "next-auth"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"

export type StudioAdmin = {
  userId: string
  email: string
}

export function isStudioAdmin(user: Session["user"] | null | undefined): boolean {
  return user?.role === "admin"
}

export async function countStudioAdmins(): Promise<number> {
  const [adminCountRow] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(users)
    .where(eq(users.role, "admin"))

  return adminCountRow?.count ?? 0
}

export async function getStudioAdmin(): Promise<StudioAdmin | null> {
  const session = await auth()
  const userId = session?.user?.id
  const email = session?.user?.email

  if (!userId || !email || !isStudioAdmin(session.user)) return null
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
