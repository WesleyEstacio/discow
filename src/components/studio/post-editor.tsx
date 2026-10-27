"use client"

import { useEffect, useState, useTransition } from "react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CopyIcon,
  DownloadIcon,
  FileArchiveIcon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react"
import type { SlideCanvasAlbum } from "@/components/studio/slide-canvas"
import { SlideInspector, type EditorAlbumOption } from "@/components/studio/slide-inspector"
import { SlidePreview } from "@/components/studio/slide-preview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { savePostAction } from "@/lib/studio/post-actions"
import { MAX_CAPTION_LENGTH, type StudioPostDraft } from "@/lib/studio/post-input"
import {
  POST_LANGUAGE_LABELS,
  POST_LANGUAGES,
  POST_STATUS_LABELS,
  POST_STATUSES,
  type PostLanguage,
  type PostStatus,
} from "@/lib/studio/post-status"
import {
  createEmptySlide,
  createSlideId,
  findMissingSlideText,
  findTextOverLimit,
  MAX_SLIDES_PER_POST,
  SLIDE_LAYOUT_LABELS,
  SLIDE_LAYOUTS,
  type StudioSlide,
} from "@/lib/studio/slides"
import { cn } from "@/lib/utils"

type PostEditorProps = {
  postId: string
  templateName: string
  initialDraft: StudioPostDraft
  albums: EditorAlbumOption[]
  coverSourcesByAlbumId: Record<string, SlideCanvasAlbum["coverSource"]>
}

function moveItem<Item>(items: Item[], fromIndex: number, toIndex: number): Item[] {
  if (toIndex < 0 || toIndex >= items.length) return items
  const reorderedItems = [...items]
  const [movedItem] = reorderedItems.splice(fromIndex, 1)
  reorderedItems.splice(toIndex, 0, movedItem!)
  return reorderedItems
}

export function PostEditor({ postId, templateName, initialDraft, albums, coverSourcesByAlbumId }: PostEditorProps) {
  const [draft, setDraft] = useState<StudioPostDraft>(initialDraft)
  const [savedDraftSnapshot, setSavedDraftSnapshot] = useState(() => JSON.stringify(initialDraft))
  const [selectedSlideId, setSelectedSlideId] = useState(initialDraft.slides[0]?.id ?? "")
  const [isSaving, startSaving] = useTransition()

  const hasUnsavedChanges = JSON.stringify(draft) !== savedDraftSnapshot
  const selectedSlideIndex = Math.max(
    0,
    draft.slides.findIndex((slide) => slide.id === selectedSlideId)
  )
  const selectedSlide = draft.slides[selectedSlideIndex]!

  const albumsById: Record<string, SlideCanvasAlbum> = Object.fromEntries(
    albums.map((album) => [
      album.id,
      {
        id: album.id,
        title: album.title,
        artistNames: album.artistNames,
        releaseYear: album.releaseYear,
        coverImageUrl: album.coverImageUrl,
        coverSource: coverSourcesByAlbumId[album.id] ?? null,
      },
    ])
  )

  useEffect(() => {
    if (!hasUnsavedChanges) return
    function warnAboutUnsavedChanges(event: BeforeUnloadEvent) {
      event.preventDefault()
    }
    window.addEventListener("beforeunload", warnAboutUnsavedChanges)
    return () => window.removeEventListener("beforeunload", warnAboutUnsavedChanges)
  }, [hasUnsavedChanges])

  function updateDraft(patch: Partial<StudioPostDraft>) {
    setDraft((currentDraft) => ({ ...currentDraft, ...patch }))
  }

  function updateSlides(updater: (slides: StudioSlide[]) => StudioSlide[]) {
    setDraft((currentDraft) => ({ ...currentDraft, slides: updater(currentDraft.slides) }))
  }

  function updateSelectedSlide(patch: Partial<StudioSlide>) {
    updateSlides((slides) => slides.map((slide) => (slide.id === selectedSlide.id ? { ...slide, ...patch } : slide)))
  }

  function addSlide(layout: StudioSlide["layout"]) {
    const newSlide = createEmptySlide(layout, { backgroundKey: selectedSlide.backgroundKey })
    updateSlides((slides) => [...slides.slice(0, selectedSlideIndex + 1), newSlide, ...slides.slice(selectedSlideIndex + 1)])
    setSelectedSlideId(newSlide.id)
  }

  function duplicateSelectedSlide() {
    const duplicatedSlide = { ...selectedSlide, id: createSlideId(), albumIds: [...selectedSlide.albumIds] }
    updateSlides((slides) => [...slides.slice(0, selectedSlideIndex + 1), duplicatedSlide, ...slides.slice(selectedSlideIndex + 1)])
    setSelectedSlideId(duplicatedSlide.id)
  }

  function deleteSelectedSlide() {
    if (draft.slides.length <= 1) return
    const nextSelectedSlide = draft.slides[selectedSlideIndex + 1] ?? draft.slides[selectedSlideIndex - 1]
    updateSlides((slides) => slides.filter((slide) => slide.id !== selectedSlide.id))
    if (nextSelectedSlide) setSelectedSlideId(nextSelectedSlide.id)
  }

  function moveSelectedSlide(direction: -1 | 1) {
    updateSlides((slides) => moveItem(slides, selectedSlideIndex, selectedSlideIndex + direction))
  }

  function saveDraft() {
    const draftBeingSaved = draft
    startSaving(async () => {
      const result = await savePostAction(postId, draftBeingSaved)
      if (!result.success) {
        toast.add({ title: "Não foi possível salvar", description: result.error, type: "error" })
        return
      }
      setSavedDraftSnapshot(JSON.stringify(draftBeingSaved))
      toast.add({ title: "Publicação salva", type: "success" })
    })
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(draft.caption)
      toast.add({ title: "Legenda copiada", type: "success" })
    } catch {
      toast.add({ title: "Não foi possível copiar", description: "Selecione o texto e copie manualmente.", type: "error" })
    }
  }

  const slidesWithIssues = draft.slides.map((slide) => ({
    missingText: findMissingSlideText(slide),
    textOverLimit: findTextOverLimit(slide),
  }))
  const selectedSlideIssues = slidesWithIssues[selectedSlideIndex]!
  const captionHasPlaceholders = /\[[^\]]+\]/.test(draft.caption)
  const exportDisabledReason = hasUnsavedChanges ? "Salve as alterações antes de exportar" : null

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-border bg-background/95 px-6 py-3 backdrop-blur md:px-10">
        <div className="flex min-w-0 flex-1 flex-col">
          <label htmlFor="post-title" className="sr-only">Título da publicação</label>
          <input
            id="post-title"
            value={draft.title}
            onChange={(event) => updateDraft({ title: event.target.value })}
            className="w-full min-w-0 rounded-md bg-transparent font-heading text-xl font-semibold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <p className="text-xs text-muted-foreground">
            {templateName} · {draft.slides.length} slides
            {hasUnsavedChanges ? <span className="text-primary"> · Alterações não salvas</span> : null}
          </p>
        </div>

        <Select value={draft.status} onValueChange={(value) => updateDraft({ status: value as PostStatus })}>
          <SelectTrigger aria-label="Status" className="w-40">
            <SelectValue>{(value: PostStatus) => POST_STATUS_LABELS[value]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {POST_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {POST_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" disabled={Boolean(exportDisabledReason)} />}
            title={exportDisabledReason ?? undefined}
          >
            <DownloadIcon data-icon="inline-start" />
            Exportar
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem render={<a href={`/api/studio/posts/${postId}/export`} download />}>
              <FileArchiveIcon />
              Todos os slides (.zip)
            </DropdownMenuItem>
            <DropdownMenuItem
              render={<a href={`/api/studio/posts/${postId}/slides/${selectedSlideIndex + 1}?download=1`} download />}
            >
              <DownloadIcon />
              Slide atual (.png)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button onClick={saveDraft} disabled={isSaving || !hasUnsavedChanges}>
          <SaveIcon data-icon="inline-start" />
          {isSaving ? "Salvando…" : "Salvar"}
        </Button>
      </div>

      <div className="grid gap-8 px-6 py-8 md:px-10 xl:grid-cols-[200px_minmax(0,1fr)_360px]">
        <section aria-label="Slides" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Slides</h2>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon-sm" disabled={draft.slides.length >= MAX_SLIDES_PER_POST} />}
                aria-label="Adicionar slide"
              >
                <PlusIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {SLIDE_LAYOUTS.map((layout) => (
                  <DropdownMenuItem key={layout} onClick={() => addSlide(layout)}>
                    {SLIDE_LAYOUT_LABELS[layout]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <ol className="flex gap-3 overflow-x-auto pb-2 xl:max-h-[calc(100vh-12rem)] xl:flex-col xl:overflow-x-visible xl:overflow-y-auto">
            {draft.slides.map((slide, slideIndex) => {
              const issues = slidesWithIssues[slideIndex]!
              const hasIssues = issues.missingText.length > 0 || issues.textOverLimit.length > 0
              return (
                <li key={slide.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedSlideId(slide.id)}
                    aria-current={slide.id === selectedSlide.id ? "true" : undefined}
                    aria-label={`Slide ${slideIndex + 1}: ${SLIDE_LAYOUT_LABELS[slide.layout]}${hasIssues ? " (precisa de atenção)" : ""}`}
                    className={cn(
                      "relative flex flex-col gap-1 rounded-lg p-1 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      slide.id === selectedSlide.id ? "bg-primary/15 ring-2 ring-primary" : "hover:bg-muted"
                    )}
                  >
                    <SlidePreview
                      slide={slide}
                      albumsById={albumsById}
                      slideNumber={slideIndex + 1}
                      slideCount={draft.slides.length}
                      displayWidth={168}
                      className="rounded-sm"
                    />
                    <span className="flex items-center gap-1 px-1 text-xs text-muted-foreground">
                      {slideIndex + 1}. {SLIDE_LAYOUT_LABELS[slide.layout]}
                      {hasIssues ? <TriangleAlertIcon className="ml-auto size-3.5 text-amber-400" aria-hidden="true" /> : null}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </section>

        <section aria-label="Prévia do slide" className="flex flex-col items-center gap-4">
          <SlidePreview
            slide={selectedSlide}
            albumsById={albumsById}
            slideNumber={selectedSlideIndex + 1}
            slideCount={draft.slides.length}
            displayWidth={432}
            className="rounded-md shadow-2xl ring-1 ring-border"
          />
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => moveSelectedSlide(-1)} disabled={selectedSlideIndex === 0}>
              <ArrowUpIcon data-icon="inline-start" />
              Mover para antes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => moveSelectedSlide(1)}
              disabled={selectedSlideIndex === draft.slides.length - 1}
            >
              <ArrowDownIcon data-icon="inline-start" />
              Mover para depois
            </Button>
            <Button variant="outline" size="sm" onClick={duplicateSelectedSlide} disabled={draft.slides.length >= MAX_SLIDES_PER_POST}>
              <CopyIcon data-icon="inline-start" />
              Duplicar
            </Button>
            <Button variant="outline" size="sm" onClick={deleteSelectedSlide} disabled={draft.slides.length <= 1}>
              <Trash2Icon data-icon="inline-start" />
              Remover
            </Button>
          </div>
          {selectedSlideIssues.missingText.length || selectedSlideIssues.textOverLimit.length ? (
            <ul className="flex max-w-md flex-col gap-1 text-sm text-amber-300" role="status">
              {selectedSlideIssues.missingText.length ? (
                <li>Falta preencher: {selectedSlideIssues.missingText.join(", ")}.</li>
              ) : null}
              {selectedSlideIssues.textOverLimit.length ? (
                <li>Texto acima do tamanho recomendado ({selectedSlideIssues.textOverLimit.join(", ")}) — pode não caber no slide.</li>
              ) : null}
            </ul>
          ) : null}
        </section>

        <section aria-label="Editar slide" className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-medium">
            Slide {selectedSlideIndex + 1} de {draft.slides.length}
          </h2>
          <SlideInspector key={selectedSlide.id} slide={selectedSlide} albums={albums} onChange={updateSelectedSlide} />
        </section>
      </div>

      <div className="border-t border-border px-6 py-8 md:px-10">
        <Tabs defaultValue="caption" className="gap-6">
          <TabsList>
            <TabsTrigger value="caption">Legenda</TabsTrigger>
            <TabsTrigger value="carousel">Carrossel completo</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
          </TabsList>

          <TabsContent value="caption" className="max-w-2xl">
            <Field>
              <div className="flex items-center gap-2">
                <FieldLabel htmlFor="post-caption">Legenda do Instagram</FieldLabel>
                <span
                  className={cn(
                    "ml-auto text-xs tabular-nums",
                    draft.caption.length > MAX_CAPTION_LENGTH ? "font-medium text-destructive" : "text-muted-foreground"
                  )}
                >
                  {draft.caption.length}/{MAX_CAPTION_LENGTH}
                </span>
              </div>
              <Textarea
                id="post-caption"
                rows={14}
                value={draft.caption}
                onChange={(event) => updateDraft({ caption: event.target.value })}
                className="font-mono text-sm leading-relaxed"
              />
              <FieldDescription>
                {captionHasPlaceholders
                  ? "Trechos entre colchetes ainda precisam ser escritos por você."
                  : "Frase de abertura, texto curto, pergunta e hashtags — ajuste a fórmula a cada post."}
              </FieldDescription>
            </Field>
            <Button variant="outline" className="mt-4" onClick={copyCaption}>
              <CopyIcon data-icon="inline-start" />
              Copiar legenda
            </Button>
          </TabsContent>

          <TabsContent value="carousel">
            <ol className="flex flex-wrap gap-4">
              {draft.slides.map((slide, slideIndex) => (
                <li key={slide.id}>
                  <SlidePreview
                    slide={slide}
                    albumsById={albumsById}
                    slideNumber={slideIndex + 1}
                    slideCount={draft.slides.length}
                    displayWidth={240}
                    className="rounded-sm ring-1 ring-border"
                  />
                </li>
              ))}
            </ol>
          </TabsContent>

          <TabsContent value="details" className="max-w-2xl">
            <FieldGroup>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="post-scheduled-for">Data prevista de publicação</FieldLabel>
                  <Input
                    id="post-scheduled-for"
                    type="date"
                    value={draft.scheduledFor ?? ""}
                    onChange={(event) => updateDraft({ scheduledFor: event.target.value || null })}
                  />
                  <FieldDescription>Só planejamento — nada é publicado automaticamente.</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="post-language">Idioma</FieldLabel>
                  <Select value={draft.language} onValueChange={(value) => updateDraft({ language: value as PostLanguage })}>
                    <SelectTrigger id="post-language" className="w-full">
                      <SelectValue>{(value: PostLanguage) => POST_LANGUAGE_LABELS[value]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {POST_LANGUAGES.map((language) => (
                        <SelectItem key={language} value={language}>
                          {POST_LANGUAGE_LABELS[language]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="post-notes">Notas internas</FieldLabel>
                <Textarea id="post-notes" rows={4} value={draft.notes} onChange={(event) => updateDraft({ notes: event.target.value })} />
              </Field>
              <div className="flex flex-col gap-2 rounded-lg border border-border p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Para publicar no Instagram</p>
                <ol className="list-decimal space-y-1 pl-5">
                  <li>Revise e mude o status para <Badge variant="secondary">Aprovada</Badge>.</li>
                  <li>Exporte os slides (.zip) e copie a legenda.</li>
                  <li>Publique manualmente pelo app do Instagram.</li>
                  <li>Volte aqui e marque como <Badge variant="secondary">Publicada</Badge>.</li>
                </ol>
              </div>
            </FieldGroup>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
