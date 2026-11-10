"use client"

import { useTransition, type FormEvent } from "react"
import { BookmarkIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import type { PostPresetSummary } from "@/lib/studio/post-presets"
import { deletePostPresetAction, savePostPresetAction } from "@/lib/studio/post-preset-actions"
import type { StudioSlide } from "@/lib/studio/slides"

type PostPresetDialogProps = {
  templateKey: string
  templateName: string
  slides: StudioSlide[]
  presets: PostPresetSummary[]
}

export function PostPresetDialog({ templateKey, templateName, slides, presets }: PostPresetDialogProps) {
  const [isSaving, startSaving] = useTransition()
  const [isDeleting, startDeleting] = useTransition()

  function savePreset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const presetForm = event.currentTarget
    const presetName = new FormData(presetForm).get("presetName")
    startSaving(async () => {
      const result = await savePostPresetAction(templateKey, presetName, slides)
      if (!result.success) {
        toast.add({ title: "Não foi possível salvar", description: result.error, type: "error" })
        return
      }
      presetForm.reset()
      toast.add({
        title: `Pré-definição "${result.presetName}" salva`,
        description: `Escolha ela ao criar um post de ${templateName}.`,
        type: "success",
      })
    })
  }

  function deletePreset(preset: PostPresetSummary) {
    startDeleting(async () => {
      await deletePostPresetAction(preset.id)
      toast.add({ title: `Pré-definição "${preset.name}" excluída`, type: "success" })
    })
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        <BookmarkIcon data-icon="inline-start" />
        Pré-definição
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Salvar como pré-definição</DialogTitle>
          <DialogDescription>
            Guarda o visual de cada slide: cores, fundo, composição, fontes, rótulo, logo e botões. Textos e álbuns ficam de fora.
          </DialogDescription>
        </DialogHeader>

        <form id="post-preset-form" onSubmit={savePreset}>
          <Field>
            <FieldLabel htmlFor="post-preset-name">Nome</FieldLabel>
            <Input id="post-preset-name" name="presetName" maxLength={60} required placeholder="Ex.: Recomendações escuras" />
            <FieldDescription>Usar um nome que já existe substitui aquela pré-definição.</FieldDescription>
          </Field>
        </form>

        {presets.length > 0 ? (
          <section aria-labelledby="saved-post-presets" className="flex flex-col gap-2">
            <h3 id="saved-post-presets" className="text-xs font-medium text-muted-foreground">
              Pré-definições de {templateName}
            </h3>
            <ul className="flex flex-col gap-1">
              {presets.map((preset) => (
                <li key={preset.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                  <PresetSwatches colors={preset.slideBackgroundColors} />
                  <span className="min-w-0 flex-1 truncate">{preset.name}</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={isDeleting}
                    onClick={() => deletePreset(preset)}
                    aria-label={`Excluir pré-definição ${preset.name}`}
                  >
                    <Trash2Icon />
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <DialogFooter>
          <Button type="submit" form="post-preset-form" disabled={isSaving}>
            <BookmarkIcon data-icon="inline-start" />
            {isSaving ? "Salvando…" : "Salvar pré-definição"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function PresetSwatches({ colors }: { colors: string[] }) {
  return (
    <span className="flex shrink-0 gap-0.5" aria-hidden="true">
      {colors.map((color, slideIndex) => (
        <span key={slideIndex} className="h-5 w-4 rounded-[3px] ring-1 ring-border" style={{ backgroundColor: color }} />
      ))}
    </span>
  )
}
