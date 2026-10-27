import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react"
import { AlbumForm } from "@/components/studio/album-form"
import { ConfirmDeleteButton } from "@/components/studio/confirm-delete-button"
import { StudioCoverImage } from "@/components/studio/studio-cover-image"
import { StudioPageHeader } from "@/components/studio/studio-page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { deleteAlbumAction, updateAlbumAction } from "@/lib/studio/album-actions"
import { requireStudioAdmin } from "@/lib/studio/admin"
import { countPostsUsingAlbum, getStudioAlbum } from "@/lib/studio/albums"
import {
  ALBUM_SOURCE_LABELS,
  COVER_SOURCE_LABELS,
  formatArtistNames,
  formatStudioDate,
} from "@/lib/studio/labels"

type AlbumPageProps = {
  params: Promise<{ albumId: string }>
}

export default async function StudioAlbumPage({ params }: AlbumPageProps) {
  await requireStudioAdmin()
  const { albumId } = await params
  const [album, postsUsingAlbumCount] = await Promise.all([
    getStudioAlbum(albumId),
    countPostsUsingAlbum(albumId),
  ])
  if (!album) notFound()

  return (
    <>
      <StudioPageHeader
        eyebrow="Biblioteca musical"
        title={album.title}
        description={formatArtistNames(album.artistNames)}
        actions={
          <>
            <Button variant="ghost" render={<Link href="/studio/music" />} nativeButton={false}>
              <ArrowLeftIcon data-icon="inline-start" />
              Biblioteca
            </Button>
            <ConfirmDeleteButton
              triggerLabel="Excluir"
              title={`Excluir "${album.title}"?`}
              description={
                postsUsingAlbumCount > 0
                  ? `Este álbum está em ${postsUsingAlbumCount} publicação(ões). Os slides que o usam ficarão sem álbum até você escolher outro.`
                  : "O álbum sai da biblioteca. Esta ação não pode ser desfeita."
              }
              onConfirm={deleteAlbumAction.bind(null, album.id)}
            />
          </>
        }
      />

      <div className="grid gap-10 px-6 py-8 md:px-10 lg:grid-cols-[1fr_280px]">
        <AlbumForm
          action={updateAlbumAction.bind(null, album.id)}
          defaults={album}
          submitLabel="Salvar alterações"
        />

        <aside className="order-first flex flex-col gap-4 lg:order-none">
          <StudioCoverImage coverImageUrl={album.coverImageUrl} albumTitle={album.title} className="w-full max-w-72" />
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Fonte</dt>
            <dd>{ALBUM_SOURCE_LABELS[album.externalSource]}</dd>
            <dt className="text-muted-foreground">Capa</dt>
            <dd>{album.coverSource ? COVER_SOURCE_LABELS[album.coverSource] : "Sem capa"}</dd>
            <dt className="text-muted-foreground">Cor</dt>
            <dd className="flex items-center gap-2">
              {album.dominantColorHex ? (
                <>
                  <span className="size-4 rounded-full border border-border" style={{ backgroundColor: album.dominantColorHex }} aria-hidden="true" />
                  {album.dominantColorHex}
                </>
              ) : (
                "Não identificada"
              )}
            </dd>
            <dt className="text-muted-foreground">Adicionado</dt>
            <dd>{formatStudioDate(album.createdAt)}</dd>
            <dt className="text-muted-foreground">Em uso</dt>
            <dd>{postsUsingAlbumCount} publicação(ões)</dd>
          </dl>
          {album.genres.length ? (
            <div className="flex flex-wrap gap-1">
              {album.genres.map((genre) => (
                <Badge key={genre} variant="secondary">{genre}</Badge>
              ))}
            </div>
          ) : null}
          {album.spotifyUrl ? (
            <Button
              variant="outline"
              size="sm"
              render={<a href={album.spotifyUrl} target="_blank" rel="noreferrer" />}
              nativeButton={false}
            >
              <ExternalLinkIcon data-icon="inline-start" />
              Abrir no Spotify
            </Button>
          ) : null}
        </aside>
      </div>
    </>
  )
}
