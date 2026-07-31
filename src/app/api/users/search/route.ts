import { NextResponse } from "next/server"
import { searchUsers } from "@/lib/users"
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit"

export async function GET(request: Request) {
  const rateLimit = checkRateLimit(request, { key: "users:search", limit: 30 })
  if (!rateLimit.success) return rateLimitExceededResponse(rateLimit.resetAt)

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") ?? ""
  const limitParam = searchParams.get("limit")
  const limit = limitParam ? Number(limitParam) : 6

  if (!q.trim()) {
    return NextResponse.json({ users: [] })
  }

  try {
    const users = await searchUsers(q, Number.isFinite(limit) ? limit : 6)
    return NextResponse.json({ users })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search users"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
