import {
  ReorderableTemplateGrid,
  type TemplateCard,
  type TemplateCardSwatch,
} from "@/components/studio/reorderable-template-grid"
import { StudioPageHeader } from "@/components/studio/studio-page-header"
import { Badge } from "@/components/ui/badge"
import { requireStudioAdmin } from "@/lib/studio/admin"
import { SLIDE_BACKGROUNDS } from "@/lib/studio/slides"
import { listOrganizedStudioTemplates } from "@/lib/studio/template-preferences"
import { PLANNED_STUDIO_TEMPLATES } from "@/lib/studio/templates"
import { findVisualIdentity, identitySwatchColors } from "@/lib/studio/visual-identities"

export const metadata = { title: "Criar publicação" }

const MAX_SLIDES_IN_STRIP = 8

function slideSwatchesFor(identityKey: string, slideCount: number): TemplateCardSwatch[] {
  const identity = findVisualIdentity(identityKey)
  const swatchKeys = identity ? identitySwatchColors(identity) : []
  if (swatchKeys.length === 0) return []
  return Array.from({ length: slideCount }, (_, slideIndex) => {
    const swatch = SLIDE_BACKGROUNDS[swatchKeys[slideIndex % swatchKeys.length]!]
    return { background: swatch.background, mutedText: swatch.mutedText }
  })
}

export default async function CreatePostPage() {
  await requireStudioAdmin()
  const organizedTemplates = await listOrganizedStudioTemplates()
  const templateCards: TemplateCard[] = organizedTemplates.map(({ template, tag }) => ({
    key: template.key,
    name: template.name,
    tagline: template.tagline,
    slideStructure: template.slideStructure,
    swatches: slideSwatchesFor(template.defaultIdentityKey, Math.min(template.slideStructure.length, MAX_SLIDES_IN_STRIP)),
    tag,
  }))

  return (
    <>
      <StudioPageHeader
        eyebrow="Criar publicação · Etapa 1 de 3"
        title="Escolha um formato"
        description="Cada formato monta a estrutura do carrossel a partir dos álbuns da biblioteca. Tudo continua editável depois."
      />
      <div className="flex flex-col gap-10 px-6 py-8 md:px-10">
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
