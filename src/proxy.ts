import { NextResponse } from "next/server"
import { auth } from "@/auth"

// Exact-match only: "/profile" (the signed-in user's own profile) requires
// auth, but "/profile/[username]" is a public profile page anyone can view.
const PROTECTED_ROUTES = ["/profile"]

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTES.includes(pathname)
}

export const proxy = auth((request) => {
  const { pathname } = request.nextUrl

  if (isProtectedPath(pathname) && !request.auth) {
    const loginUrl = new URL("/library", request.nextUrl.origin)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
