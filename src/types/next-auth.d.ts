import type { DefaultSession } from "next-auth"
import type { UserRole } from "@/lib/user-role"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username: string | null
      role: UserRole
    } & DefaultSession["user"]
  }
}
