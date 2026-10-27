import Link from "next/link"
import { StudioPageHeader } from "@/components/studio/studio-page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { requireStudioAdmin } from "@/lib/studio/admin"
import { SLIDE_BACKGROUND_KEYS, SLIDE_BACKGROUNDS, SLIDE_LAYOUT_LABELS, SLIDE_LAYOUTS } from "@/lib/studio/slides"
import { PLANNED_STUDIO_TEMPLATES, STUDIO_TEMPLATES } from "@/lib/studio/templates"

export const metadata = { title: "Modelos" }

export default async function TemplatesPage() {
  await requireStudioAdmin()

  return (
    <>
      <StudioPageHeader
        eyebrow="Modelos"
        title="Formatos de conteúdo"
        description="Cada formato define quais álbuns escolher, a estrutura dos slides e a legenda inicial. Todos usam o mesmo sistema visual de 1080 × 1350 px."
      />
      <div className="flex flex-col gap-12 px-6 py-8 md:px-10">
        <ul className="flex flex-col gap-6">
          {[...STUDIO_TEMPLATES, ...PLANNED_STUDIO_TEMPLATES].map((template) => (
            <li key={template.key} className="grid gap-6 rounded-xl border border-border p-6 lg:grid-cols-[1fr_1fr_auto]">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-heading text-lg font-semibold">{template.name}</h2>
                  {template.isAvailable ? (
                    <Badge variant="secondary">Disponível</Badge>
                  ) : (
                    <Badge variant="outline">Fase 2</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{template.objective}</p>
              </div>
              <ol className="flex flex-col gap-1 text-sm">
                {template.slideStructure.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="w-5 shrink-0 text-muted-foreground tabular-nums">{index + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
              {template.isAvailable ? (
                <Button variant="outline" render={<Link href={`/studio/create/${template.key}`} />} nativeButton={false}>
                  Usar formato
                </Button>
              ) : null}
            </li>
          ))}
        </ul>

        <section aria-labelledby="visual-system" className="grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h2 id="visual-system" className="font-heading text-lg font-medium">Fundos aprovados</h2>
            <ul className="flex flex-wrap gap-4">
              {SLIDE_BACKGROUND_KEYS.map((backgroundKey) => (
                <li key={backgroundKey} className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className="flex size-16 items-center justify-center rounded-lg border border-border font-semibold"
                    style={{ backgroundColor: SLIDE_BACKGROUNDS[backgroundKey].background, color: SLIDE_BACKGROUNDS[backgroundKey].text }}
                  >
                    Aa
                  </span>
                  {SLIDE_BACKGROUNDS[backgroundKey].label}
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground">
              Cores personalizadas ajustam o texto automaticamente para manter o contraste.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="font-heading text-lg font-medium">Layouts de slide</h2>
            <ul className="flex flex-wrap gap-2">
              {SLIDE_LAYOUTS.map((layout) => (
                <li key={layout}>
                  <Badge variant="outline">{SLIDE_LAYOUT_LABELS[layout]}</Badge>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground">
              As capas aparecem inteiras, sem cortes, sobreposições ou filtros, com o crédito da fonte no rodapé do slide.
            </p>
          </div>
        </section>
      </div>
    </>
  )
}
