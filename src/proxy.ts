import { NextResponse } from "next/server"
import { auth } from "@/auth"

const PROTECTED_ROUTES = ["/profile"]

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

export const proxy = auth((request) => {
  const { pathname } = request.nextUrl

  if (isProtectedPath(pathname) && !request.auth) {
    const loginUrl = new URL("/login", request.nextUrl.origin)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
