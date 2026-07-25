import { auth } from "@/auth"
import { AppHeader } from "@/components/app-header"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader user={session?.user ?? null} />
      <div className="flex-1">{children}</div>
    </div>
  )
}
