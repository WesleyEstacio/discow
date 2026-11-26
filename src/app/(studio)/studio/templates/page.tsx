import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import { SlidePreview } from "@/components/studio/slide-preview"
import { SlideStructureDetails } from "@/components/studio/slide-structure-details"
import { StudioPageHeader } from "@/components/studio/studio-page-header"
import { TemplateDeckPreview } from "@/components/studio/template-deck-preview"
import { Button } from "@/components/ui/button"
import { requireStudioAdmin } from "@/lib/studio/admin"
import { listStudioAlbums } from "@/lib/studio/albums"
import { buildTemplatePreview } from "@/lib/studio/template-previews"
import { STUDIO_TEMPLATES } from "@/lib/studio/templates"
import { VISUAL_IDENTITIES } from "@/lib/studio/visual-identities"

export const metadata = { title: "Modelos" }

const PREVIEW_SLIDES_PER_FORMAT = 3
const SAMPLE_ALBUMS_FOR_PREVIEWS = 40
const IDENTITY_PREVIEW_WIDTH = 168

export default async function TemplatesPage() {
  await requireStudioAdmin()
  const libraryAlbums = await listStudioAlbums({}, SAMPLE_ALBUMS_FOR_PREVIEWS)
  const albumsWithCovers = libraryAlbums.filter((album) => album.coverImageUrl)
  const identityShowcaseTemplate = STUDIO_TEMPLATES[0]

  return (
    <>
      <StudioPageHeader
        eyebrow="Modelos"
        title="Formatos e identidades"
        description="Os formatos definem quais álbuns escolher, a estrutura dos slides e a legenda inicial. As identidades dão o visual, e qualquer formato pode usar qualquer identidade."
      />
      <div className="flex flex-col gap-14 px-6 py-8 md:px-10">
        <section aria-labelledby="formats" className="flex flex-col gap-5">
          <h2 id="formats" className="font-heading text-lg font-medium">Formatos de conteúdo</h2>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] gap-6">
            {STUDIO_TEMPLATES.map((template, templateIndex) => {
              const sampleAlbums = [...albumsWithCovers.slice(templateIndex * 3), ...albumsWithCovers.slice(0, templateIndex * 3)]
              return (
                <li key={template.key} className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
                  <div className="p-3 pb-0">
                    <TemplateDeckPreview preview={buildTemplatePreview(template, sampleAlbums, PREVIEW_SLIDES_PER_FORMAT)} />
                  </div>
                  <div className="flex flex-1 flex-col gap-4 p-5">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="font-heading text-xl font-semibold tracking-tight">{template.name}</h3>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{template.slideStructure.length} slides</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{template.objective}</p>
                    </div>
                    <div className="mt-auto">
                      <SlideStructureDetails slideStructure={template.slideStructure} />
                    </div>
                  </div>
                  <div className="flex justify-end border-t border-border px-3 py-2">
                    <Button variant="ghost" size="sm" render={<Link href={`/studio/create/${template.key}`} />} nativeButton={false}>
                      Usar formato
                      <ArrowRightIcon data-icon="inline-end" />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        <section aria-labelledby="identities" className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 id="identities" className="font-heading text-lg font-medium">Identidades visuais</h2>
            <p className="text-sm text-muted-foreground">
              A capa de exemplo usa os mesmos discos em todas, para comparar só o visual. As capas dos álbuns aparecem sempre inteiras, sem cortes nem filtros.
            </p>
          </div>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,13rem),1fr))] gap-6">
            {VISUAL_IDENTITIES.map((identity) => {
              const preview = identityShowcaseTemplate
                ? buildTemplatePreview(identityShowcaseTemplate, albumsWithCovers, 1, identity)
                : null
              const coverSlide = preview?.slides[0]
              return (
                <li key={identity.key} className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
                  <div className="p-3 pb-0">
                    <div aria-hidden="true" className="flex h-60 items-center justify-center rounded-lg bg-muted/40">
                      {preview && coverSlide ? (
                        <div className="overflow-hidden rounded-md shadow-lg shadow-black/30 ring-1 ring-white/10">
                          <SlidePreview
                            slide={coverSlide}
                            albumsById={preview.albumsById}
                            carouselAlbumIds={preview.carouselAlbumIds}
                            slideNumber={1}
                            slideCount={preview.slideCount}
                            displayWidth={IDENTITY_PREVIEW_WIDTH}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 p-5">
                    <h3 className="font-heading text-base font-semibold tracking-tight">{identity.label}</h3>
                    <p className="text-sm text-muted-foreground">{identity.description}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </>
  )
}
