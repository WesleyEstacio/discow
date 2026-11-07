import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import { StudioPageHeader } from "@/components/studio/studio-page-header"
import { Badge } from "@/components/ui/badge"
import { requireStudioAdmin } from "@/lib/studio/admin"
import { SLIDE_BACKGROUNDS } from "@/lib/studio/slides"
import { PLANNED_STUDIO_TEMPLATES, STUDIO_TEMPLATES } from "@/lib/studio/templates"
import { findVisualIdentity, identitySwatchColors } from "@/lib/studio/visual-identities"

export const metadata = { title: "Criar publicação" }

function SlideStrip({ identityKey, slideCount }: { identityKey: string; slideCount: number }) {
  const identity = findVisualIdentity(identityKey)
  const swatchKeys = identity ? identitySwatchColors(identity) : []
  if (swatchKeys.length === 0) return null

  return (
    <div className="flex gap-1.5" aria-hidden="true">
      {Array.from({ length: slideCount }, (_, slideIndex) => {
        const swatch = SLIDE_BACKGROUNDS[swatchKeys[slideIndex % swatchKeys.length]!]
        return (
          <span
            key={slideIndex}
            className="flex aspect-[4/5] w-8 items-end rounded-sm p-1 font-mono text-[10px] leading-none tabular-nums ring-1 ring-border"
            style={{ backgroundColor: swatch.background, color: swatch.mutedText }}
          >
            {slideIndex + 1}
          </span>
        )
      })}
    </div>
  )
}

export default async function CreatePostPage() {
  await requireStudioAdmin()

  return (
    <>
      <StudioPageHeader
        eyebrow="Criar publicação · Etapa 1 de 3"
        title="Escolha um formato"
        description="Cada formato monta a estrutura do carrossel a partir dos álbuns da biblioteca. Tudo continua editável depois."
      />
      <div className="flex flex-col gap-10 px-6 py-8 md:px-10">
        <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {STUDIO_TEMPLATES.map((template) => (
            <li key={template.key}>
              <Link
                href={`/studio/create/${template.key}`}
                className="group flex h-full flex-col gap-5 rounded-xl border border-border bg-card p-5 outline-none transition-colors hover:border-foreground/25 hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <SlideStrip identityKey={template.defaultIdentityKey} slideCount={Math.min(template.slideStructure.length, 8)} />
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h2 className="font-heading text-lg font-semibold tracking-tight">{template.name}</h2>
                    <p className="text-sm text-muted-foreground">{template.tagline}</p>
                  </div>
                  <ArrowRightIcon
                    className="mt-1 size-4 shrink-0 text-muted-foreground transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-foreground"
                    aria-hidden="true"
                  />
                </div>
                <ol className="mt-auto flex flex-col gap-1 border-t border-border pt-4 text-sm text-muted-foreground">
                  {template.slideStructure.map((step, index) => (
                    <li key={step} className="flex gap-3">
                      <span className="w-5 shrink-0 font-mono text-xs leading-5 tabular-nums">{String(index + 1).padStart(2, "0")}</span>
                      <span className="text-foreground/85">{step}</span>
                    </li>
                  ))}
                </ol>
              </Link>
            </li>
          ))}
        </ul>

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
