import Link from "next/link"
import { CalendarDaysIcon, Disc3Icon, PlusIcon, SearchIcon } from "lucide-react"
import { PostStatusBadge } from "@/components/studio/post-status-badge"
import { StudioCoverImage } from "@/components/studio/studio-cover-image"
import { StudioPageHeader } from "@/components/studio/studio-page-header"
import { Button } from "@/components/ui/button"
import { requireStudioAdmin } from "@/lib/studio/admin"
import { formatArtistNames, formatStudioDate, formatStudioDateTime } from "@/lib/studio/labels"
import { POST_STATUSES } from "@/lib/studio/post-status"
import {
  countStudioPostsByStatus,
  listRecentlyAddedAlbums,
  listRecentlyUsedAlbums,
  listRecentStudioPosts,
  listUpcomingScheduledPosts,
} from "@/lib/studio/posts"
import { findTemplateName } from "@/lib/studio/templates"

export const metadata = { title: "Visão geral" }

type ActivityItem = {
  key: string
  date: Date
  description: string
  href: string
}

export default async function StudioOverviewPage() {
  await requireStudioAdmin()

  const [postCountsByStatus, upcomingPosts, recentPosts, recentlyUsedAlbums, recentlyAddedAlbums] = await Promise.all([
    countStudioPostsByStatus(),
    listUpcomingScheduledPosts(),
    listRecentStudioPosts(),
    listRecentlyUsedAlbums(),
    listRecentlyAddedAlbums(),
  ])

  const totalPostCount = POST_STATUSES.reduce((total, status) => total + postCountsByStatus[status], 0)
  const productionMetrics = [
    { label: "Publicações criadas", value: totalPostCount, href: "/studio/posts" },
    { label: "Aguardando revisão", value: postCountsByStatus.draft + postCountsByStatus.in_review, href: "/studio/posts?status=in_review" },
    { label: "Aprovadas", value: postCountsByStatus.approved, href: "/studio/posts?status=approved" },
    { label: "Publicadas", value: postCountsByStatus.published, href: "/studio/posts?status=published" },
  ]

  const recentActivity: ActivityItem[] = [
    ...recentPosts.map((post) => ({
      key: `post-${post.id}`,
      date: post.updatedAt,
      description: `${post.createdAt.getTime() === post.updatedAt.getTime() ? "Criada" : "Editada"}: ${post.title}`,
      href: `/studio/posts/${post.id}`,
    })),
    ...recentlyAddedAlbums.map((album) => ({
      key: `album-${album.id}`,
      date: album.createdAt,
      description: `Álbum salvo: ${album.title} — ${formatArtistNames(album.artistNames)}`,
      href: `/studio/music/${album.id}`,
    })),
  ]
    .sort((firstItem, secondItem) => secondItem.date.getTime() - firstItem.date.getTime())
    .slice(0, 8)

  return (
    <>
      <StudioPageHeader
        eyebrow="Discows Studio"
        title="Visão geral"
        description="O que está em produção, o que vem a seguir e os discos que você mais tem usado."
        actions={
          <>
            <Button render={<Link href="/studio/create" />} nativeButton={false}>
              <PlusIcon data-icon="inline-start" />
              Nova publicação
            </Button>
            <Button variant="outline" render={<Link href="/studio/music/search" />} nativeButton={false}>
              <SearchIcon data-icon="inline-start" />
              Buscar e salvar álbum
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-10 px-6 py-8 md:px-10">
        <section aria-label="Produção de conteúdo">
          <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4">
            {productionMetrics.map((metric) => (
              <li key={metric.label} className="bg-background">
                <Link
                  href={metric.href}
                  className="flex h-full flex-col gap-2 p-5 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50"
                >
                  <span className="font-heading text-4xl font-semibold tracking-tight tabular-nums">{metric.value}</span>
                  <span className="text-sm text-muted-foreground">{metric.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Métricas de desempenho do Instagram aparecem aqui quando a integração oficial da Meta estiver configurada.
          </p>
        </section>

        <div className="grid gap-10 lg:grid-cols-2">
          <section aria-labelledby="upcoming-posts" className="flex flex-col gap-4">
            <h2 id="upcoming-posts" className="font-heading text-lg font-medium">Próximas publicações</h2>
            {upcomingPosts.length === 0 ? (
              <EmptyPanel icon={<CalendarDaysIcon className="size-5" aria-hidden="true" />}>
                Nenhuma publicação com data prevista. Defina a data na aba &ldquo;Detalhes&rdquo; do editor.
              </EmptyPanel>
            ) : (
              <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
                {upcomingPosts.map((post) => (
                  <li key={post.id}>
                    <Link
                      href={`/studio/posts/${post.id}`}
                      className="flex items-center gap-4 p-4 outline-none hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50"
                    >
                      <span className="w-24 shrink-0 text-sm tabular-nums text-muted-foreground">
                        {post.scheduledFor ? formatStudioDate(post.scheduledFor) : ""}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{post.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">{findTemplateName(post.templateKey)}</span>
                      </span>
                      <PostStatusBadge status={post.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="recent-activity" className="flex flex-col gap-4">
            <h2 id="recent-activity" className="font-heading text-lg font-medium">Atividade recente</h2>
            {recentActivity.length === 0 ? (
              <EmptyPanel icon={<PlusIcon className="size-5" aria-hidden="true" />}>
                Nada por aqui ainda. Comece salvando álbuns e criando a primeira publicação.
              </EmptyPanel>
            ) : (
              <ul className="flex flex-col gap-3">
                {recentActivity.map((activityItem) => (
                  <li key={activityItem.key} className="flex gap-4 text-sm">
                    <span className="w-36 shrink-0 text-muted-foreground tabular-nums">{formatStudioDateTime(activityItem.date)}</span>
                    <Link href={activityItem.href} className="min-w-0 truncate underline-offset-4 hover:underline">
                      {activityItem.description}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section aria-labelledby="recently-used-albums" className="flex flex-col gap-4">
          <h2 id="recently-used-albums" className="font-heading text-lg font-medium">Álbuns usados recentemente</h2>
          {recentlyUsedAlbums.length === 0 ? (
            <EmptyPanel icon={<Disc3Icon className="size-5" aria-hidden="true" />}>
              Os álbuns que entrarem nas suas publicações aparecem aqui para reutilizar rápido.
            </EmptyPanel>
          ) : (
            <ul className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-8">
              {recentlyUsedAlbums.map((album) => (
                <li key={album.id}>
                  <Link href={`/studio/music/${album.id}`} className="flex flex-col gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                    <StudioCoverImage coverImageUrl={album.coverImageUrl} albumTitle={album.title} className="w-full" />
                    <span className="truncate text-xs">{album.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}

function EmptyPanel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
      {icon}
      <p>{children}</p>
    </div>
  )
}
