import Link from "next/link"
import { CalendarDaysIcon, Disc3Icon, PlusIcon, SearchIcon } from "lucide-react"
import { PostCard } from "@/components/studio/post-card"
import { PostCoverThumbnail } from "@/components/studio/post-cover-thumbnail"
import { PostStatusBadge } from "@/components/studio/post-status-badge"
import { StudioCoverImage } from "@/components/studio/studio-cover-image"
import { StudioPageHeader } from "@/components/studio/studio-page-header"
import { Button } from "@/components/ui/button"
import { requireStudioAdmin } from "@/lib/studio/admin"
import { formatArtistNames, formatStudioDate, formatStudioDateTime } from "@/lib/studio/labels"
import { loadPostCovers } from "@/lib/studio/post-covers"
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

const RECENT_POSTS_ON_OVERVIEW = 4

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

  const coversByPostId = await loadPostCovers([...recentPosts, ...upcomingPosts])

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
          <Button variant="outline" render={<Link href="/studio/music/search" />} nativeButton={false}>
            <SearchIcon data-icon="inline-start" />
            Buscar e salvar álbum
          </Button>
        }
      />

      <div className="flex flex-col gap-10 px-6 py-8 md:px-10">
        <section aria-label="Produção de conteúdo">
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {productionMetrics.map((metric) => (
              <li key={metric.label}>
                <Link
                  href={metric.href}
                  className="flex h-full flex-col gap-2 rounded-xl border border-border bg-card p-5 outline-none transition-colors hover:border-foreground/25 focus-visible:ring-3 focus-visible:ring-ring/50"
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

        {recentPosts.length > 0 ? (
          <section aria-labelledby="recent-posts" className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="recent-posts" className="font-heading text-lg font-medium">Em produção</h2>
              <Link href="/studio/posts" className="rounded-sm text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
                Ver todas
              </Link>
            </div>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-6">
              {recentPosts.slice(0, RECENT_POSTS_ON_OVERVIEW).map((post) => (
                <PostCard key={post.id} post={post} cover={coversByPostId.get(post.id)} />
              ))}
            </ul>
          </section>
        ) : null}

        <div className="grid gap-10 lg:grid-cols-2">
          <section aria-labelledby="upcoming-posts" className="flex flex-col gap-4">
            <h2 id="upcoming-posts" className="font-heading text-lg font-medium">Próximas publicações</h2>
            {upcomingPosts.length === 0 ? (
              <EmptyPanel icon={<CalendarDaysIcon className="size-5" aria-hidden="true" />}>
                Nenhuma publicação com data prevista. Defina a data na aba &ldquo;Detalhes&rdquo; do editor.
              </EmptyPanel>
            ) : (
              <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                {upcomingPosts.map((post) => (
                  <li key={post.id}>
                    <Link
                      href={`/studio/posts/${post.id}`}
                      className="flex items-center gap-4 p-3 outline-none hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50"
                    >
                      <PostCoverThumbnail cover={coversByPostId.get(post.id)} width={48} className="rounded-sm shadow-none" />
                      <span className="w-24 shrink-0 text-sm font-medium tabular-nums">
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
              <ol className="flex flex-col border-l border-border">
                {recentActivity.map((activityItem) => (
                  <li key={activityItem.key} className="relative flex flex-col gap-0.5 py-2 pl-5 text-sm">
                    <span aria-hidden="true" className="absolute top-3.5 -left-[5px] size-2.5 rounded-full border-2 border-background bg-primary" />
                    <Link href={activityItem.href} className="min-w-0 truncate rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
                      {activityItem.description}
                    </Link>
                    <span className="text-xs text-muted-foreground tabular-nums">{formatStudioDateTime(activityItem.date)}</span>
                  </li>
                ))}
              </ol>
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
                    <StudioCoverImage coverImageUrl={album.coverImageUrl} albumTitle={album.title} className="w-full shadow-lg shadow-black/30 ring-1 ring-white/10" />
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
    <div className="flex items-start gap-3 rounded-xl border border-dashed border-border bg-card/50 p-5 text-sm text-muted-foreground">
      {icon}
      <p>{children}</p>
    </div>
  )
}
