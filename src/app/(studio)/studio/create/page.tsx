import { CreationSteps } from "@/components/studio/creation-steps"
import { ReorderableTemplateGrid, type TemplateCard } from "@/components/studio/reorderable-template-grid"
import { StudioPageHeader } from "@/components/studio/studio-page-header"
import { TemplateDeckPreview } from "@/components/studio/template-deck-preview"
import { Badge } from "@/components/ui/badge"
import { requireStudioAdmin } from "@/lib/studio/admin"
import { listStudioAlbums } from "@/lib/studio/albums"
import { listOrganizedStudioTemplates } from "@/lib/studio/template-preferences"
import { buildTemplatePreview } from "@/lib/studio/template-previews"
import { PLANNED_STUDIO_TEMPLATES } from "@/lib/studio/templates"

export const metadata = { title: "Criar publicação" }

const PREVIEW_SLIDES_PER_FORMAT = 3
const SAMPLE_ALBUMS_FOR_PREVIEWS = 40

export default async function CreatePostPage() {
  await requireStudioAdmin()
  const [organizedTemplates, libraryAlbums] = await Promise.all([
    listOrganizedStudioTemplates(),
    listStudioAlbums({}, SAMPLE_ALBUMS_FOR_PREVIEWS),
  ])
  const albumsWithCovers = libraryAlbums.filter((album) => album.coverImageUrl)

  const templateCards: TemplateCard[] = organizedTemplates.map(({ template, tag }, templateIndex) => {
    const sampleAlbums = [...albumsWithCovers.slice(templateIndex * 3), ...albumsWithCovers.slice(0, templateIndex * 3)]
    return {
      key: template.key,
      name: template.name,
      tagline: template.tagline,
      slideStructure: template.slideStructure,
      preview: <TemplateDeckPreview preview={buildTemplatePreview(template, sampleAlbums, PREVIEW_SLIDES_PER_FORMAT)} />,
      tag,
    }
  })

  return (
    <>
      <StudioPageHeader
        eyebrow="Criar publicação"
        title="Escolha um formato"
        description="Cada formato monta o carrossel a partir dos álbuns da biblioteca, e tudo continua editável depois. Arraste os cards para mudar a ordem."
      />
      <div className="flex flex-col gap-8 px-6 py-8 md:px-10">
        <CreationSteps isChoosingFormat />
        <ReorderableTemplateGrid cards={templateCards} />

        {PLANNED_STUDIO_TEMPLATES.length > 0 ? (
          <section aria-labelledby="planned-templates" className="flex flex-col gap-4">
            <h2 id="planned-templates" className="text-sm font-medium text-muted-foreground">
              Próximos formatos
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {PLANNED_STUDIO_TEMPLATES.map((template) => (
                <li key={template.key} className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-4 text-muted-foreground">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-foreground/80">{template.name}</p>
                    <Badge variant="outline">Fase 2</Badge>
                  </div>
                  <p className="text-sm">{template.tagline}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  )
}
