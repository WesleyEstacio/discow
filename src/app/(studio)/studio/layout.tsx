import { StudioSidebar } from "@/components/studio/studio-sidebar"
import { requireStudioAdmin } from "@/lib/studio/admin"

export default async function StudioLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const admin = await requireStudioAdmin()

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <StudioSidebar adminEmail={admin.email} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}
