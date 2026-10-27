import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import { StudioPageHeader } from "@/components/studio/studio-page-header"
import { Badge } from "@/components/ui/badge"
import { requireStudioAdmin } from "@/lib/studio/admin"
import { PLANNED_STUDIO_TEMPLATES, STUDIO_TEMPLATES } from "@/lib/studio/templates"

export const metadata = { title: "Criar publicação" }

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
        <ul className="grid gap-4 md:grid-cols-2">
          {STUDIO_TEMPLATES.map((template) => (
            <li key={template.key}>
              <Link
                href={`/studio/create/${template.key}`}
                className="group flex h-full flex-col gap-4 rounded-xl border border-border bg-card p-6 outline-none transition-colors hover:border-primary/60 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h2 className="font-heading text-xl font-semibold tracking-tight">{template.name}</h2>
                    <p className="text-sm text-muted-foreground">{template.tagline}</p>
                  </div>
                  <ArrowRightIcon className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" aria-hidden="true" />
                </div>
                <ol className="flex flex-col gap-1.5 text-sm">
                  {template.slideStructure.map((step, index) => (
                    <li key={step} className="flex gap-3">
                      <span className="w-5 shrink-0 text-muted-foreground tabular-nums">{index + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </Link>
            </li>
          ))}
        </ul>

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
      </div>
    </>
  )
}
