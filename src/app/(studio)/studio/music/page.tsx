import Link from "next/link"
import { Disc3Icon, PlusIcon, SearchIcon } from "lucide-react"
import { StudioCoverImage } from "@/components/studio/studio-cover-image"
import { StudioPageHeader } from "@/components/studio/studio-page-header"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requireStudioAdmin } from "@/lib/studio/admin"
import { listStudioAlbums } from "@/lib/studio/albums"
import { ALBUM_SOURCE_LABELS, formatArtistNames } from "@/lib/studio/labels"

export const metadata = { title: "Biblioteca musical" }

type MusicLibraryPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readSearchParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? ""
}

export default async function MusicLibraryPage({ searchParams }: MusicLibraryPageProps) {
  await requireStudioAdmin()
  const params = await searchParams
  const filters = {
    text: readSearchParam(params.q),
    genre: readSearchParam(params.genre),
    year: readSearchParam(params.year),
    tag: readSearchParam(params.tag),
  }
  const hasFilters = Object.values(filters).some(Boolean)
  const albums = await listStudioAlbums(filters)

  return (
    <>
      <StudioPageHeader
        eyebrow="Biblioteca musical"
        title="Álbuns salvos"
        description="Álbuns pesquisados uma vez ficam aqui para reutilizar em qualquer publicação."
        actions={
          <>
            <Button render={<Link href="/studio/music/search" />} nativeButton={false}>
              <SearchIcon data-icon="inline-start" />
              Buscar álbuns
            </Button>
            <Button variant="outline" render={<Link href="/studio/music/new" />} nativeButton={false}>
              <PlusIcon data-icon="inline-start" />
              Cadastrar manualmente
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-8 px-6 py-8 md:px-10">
        <form className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end" role="search">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="library-text">Álbum ou artista</Label>
            <Input id="library-text" name="q" defaultValue={filters.text} placeholder="Ex.: Blonde, Frank Ocean" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="library-genre">Gênero</Label>
            <Input id="library-genre" name="genre" defaultValue={filters.genre} placeholder="Ex.: r&b" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="library-year">Ano</Label>
            <Input id="library-year" name="year" defaultValue={filters.year} inputMode="numeric" placeholder="Ex.: 2016" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="library-tag">Tag ou clima</Label>
            <Input id="library-tag" name="tag" defaultValue={filters.tag} placeholder="Ex.: madrugada" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="secondary">Filtrar</Button>
            {hasFilters ? (
              <Button variant="ghost" render={<Link href="/studio/music" />} nativeButton={false}>
                Limpar
              </Button>
            ) : null}
          </div>
        </form>

        {albums.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Disc3Icon />
              </EmptyMedia>
              <EmptyTitle>{hasFilters ? "Nenhum álbum com esses filtros" : "Sua biblioteca está vazia"}</EmptyTitle>
              <EmptyDescription>
                {hasFilters
                  ? "Tente outro termo ou limpe os filtros."
                  : "Busque no Spotify ou no MusicBrainz e salve os álbuns que você quer usar nas publicações."}
              </EmptyDescription>
            </EmptyHeader>
            {hasFilters ? null : (
              <EmptyContent>
                <Button render={<Link href="/studio/music/search" />} nativeButton={false}>
                  <SearchIcon data-icon="inline-start" />
                  Buscar o primeiro álbum
                </Button>
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,11rem),1fr))] gap-x-6 gap-y-10">
            {albums.map((album) => (
              <li key={album.id}>
                <Link
                  href={`/studio/music/${album.id}`}
                  className="group flex flex-col gap-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <StudioCoverImage
                    coverImageUrl={album.coverImageUrl}
                    albumTitle={album.title}
                    className="w-full shadow-lg shadow-black/30 ring-1 ring-white/10 transition-transform duration-300 ease-out group-hover:-translate-y-1 motion-reduce:transition-none"
                  />
                  <div className="flex flex-col gap-0.5">
                    <p className="line-clamp-2 font-medium leading-snug group-hover:underline group-hover:underline-offset-4">{album.title}</p>
                    <p className="truncate text-sm text-muted-foreground">{formatArtistNames(album.artistNames)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[album.releaseYear, ALBUM_SOURCE_LABELS[album.externalSource], album.tags[0]].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
