import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { LoginForm } from "@/components/login-form"

export const metadata: Metadata = {
  title: "Login",
}

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>
}

export default async function Page({ searchParams }: LoginPageProps) {
  const session = await auth()
  const { callbackUrl } = await searchParams

  if (session?.user) {
    redirect(callbackUrl ?? "/profile")
  }

  return (
    <div className="flex w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm callbackUrl={callbackUrl} />
      </div>
    </div>
  )
}
