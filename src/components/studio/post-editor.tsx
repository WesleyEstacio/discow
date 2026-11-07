"use client"

import { useEffect, useState, useTransition } from "react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  CopyIcon,
  PaletteIcon,
  DownloadIcon,
  FileArchiveIcon,
  PlusIcon,
  SaveIcon,
  ShuffleIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react"
import type { SlideCanvasAlbum } from "@/components/studio/slide-canvas"
import { IdentitySwatches } from "@/components/studio/identity-swatches"
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
import type { StudioImageSummary } from "@/lib/studio/background-images"
import type { HighlightFontKey } from "@/lib/studio/highlight-fonts"
import { savePostAction } from "@/lib/studio/post-actions"
import { collectCarouselAlbumIds } from "@/lib/studio/blurred-covers"
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
  pickSlideElementToggles,
  SLIDE_LAYOUT_LABELS,
  SLIDE_LAYOUTS,
  type StudioSlide,
} from "@/lib/studio/slides"
import {
  applyVisualIdentity,
  findVisualIdentity,
  pickRandomVisualIdentity,
  SURPRISE_IDENTITY_KEY,
  VISUAL_IDENTITIES,
} from "@/lib/studio/visual-identities"
import { cn } from "@/lib/utils"

type PostEditorProps = {
  postId: string
  templateName: string
  initialDraft: StudioPostDraft
  albums: EditorAlbumOption[]
  coverSourcesByAlbumId: Record<string, SlideCanvasAlbum["coverSource"]>
  initialUploadedImages: StudioImageSummary[]
  highlightFontKey: HighlightFontKey
}

function moveItem<Item>(items: Item[], fromIndex: number, toIndex: number): Item[] {
  if (toIndex < 0 || toIndex >= items.length) return items
  const reorderedItems = [...items]
  const [movedItem] = reorderedItems.splice(fromIndex, 1)
  reorderedItems.splice(toIndex, 0, movedItem!)
  return reorderedItems
}

export function PostEditor({
  postId,
  templateName,
  initialDraft,
  albums,
  coverSourcesByAlbumId,
  initialUploadedImages,
  highlightFontKey,
}: PostEditorProps) {
  const [draft, setDraft] = useState<StudioPostDraft>(initialDraft)
  const [uploadedImages, setUploadedImages] = useState(initialUploadedImages)
  const [savedDraftSnapshot, setSavedDraftSnapshot] = useState(() => JSON.stringify(initialDraft))
  const [selectedSlideId, setSelectedSlideId] = useState(initialDraft.slides[0]?.id ?? "")
  const [isSaving, startSaving] = useTransition()

  const hasUnsavedChanges = JSON.stringify(draft) !== savedDraftSnapshot
  const selectedSlideIndex = Math.max(
    0,
    draft.slides.findIndex((slide) => slide.id === selectedSlideId)
  )
  const selectedSlide = draft.slides[selectedSlideIndex]!

  const carouselAlbumIds = collectCarouselAlbumIds(draft.slides)
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
    const newSlide = createEmptySlide(layout, {
      backgroundKey: selectedSlide.backgroundKey,
      customBackgroundHex: selectedSlide.customBackgroundHex,
      backgroundStyle: selectedSlide.backgroundStyle,
      accentHex: selectedSlide.accentHex,
      customTextHex: selectedSlide.customTextHex,
      typeStyle: selectedSlide.typeStyle,
      kickerStyle: selectedSlide.kickerStyle,
      albumCoverRadius: selectedSlide.albumCoverRadius,
      ...pickSlideElementToggles(selectedSlide),
    })
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

  function applyToAllSlides(patch: Partial<StudioSlide>, confirmationMessage: string) {
    updateSlides((slides) => slides.map((slide) => ({ ...slide, ...patch })))
    toast.add({ title: confirmationMessage, type: "success" })
  }

  function applyIdentityToAllSlides(identityKey: string) {
    const identity = identityKey === SURPRISE_IDENTITY_KEY ? pickRandomVisualIdentity() : findVisualIdentity(identityKey)
    if (!identity) return
    updateSlides((slides) => applyVisualIdentity(slides, identity, { keepCustomBackgrounds: false }))
    toast.add({ title: `Identidade "${identity.label}" aplicada`, description: "Textos e álbuns continuam iguais.", type: "success" })
  }

  function markImageAsDefaultBackground(imageId: string, isDefaultBackground: boolean) {
    setUploadedImages((currentImages) =>
      currentImages.map((image) => (image.id === imageId ? { ...image, isDefaultBackground } : image))
    )
  }

  async function persistDraft(draftBeingSaved: StudioPostDraft): Promise<boolean> {
    const result = await savePostAction(postId, draftBeingSaved)
    if (!result.success) {
      toast.add({ title: "Não foi possível salvar", description: result.error, type: "error" })
      return false
    }
    setSavedDraftSnapshot(JSON.stringify(draftBeingSaved))
    return true
  }

  function saveDraft() {
    const draftBeingSaved = draft
    startSaving(async () => {
      if (await persistDraft(draftBeingSaved)) toast.add({ title: "Publicação salva", type: "success" })
    })
  }

  function startDownload(downloadUrl: string) {
    window.location.assign(downloadUrl)
    toast.add({ title: "Gerando os slides…", description: "O download começa em alguns segundos." })
  }

  // The export reads the saved post, so pending edits are saved first.
  function saveAndDownload(downloadUrl: string) {
    if (!hasUnsavedChanges) {
      startDownload(downloadUrl)
      return
    }
    const draftBeingSaved = draft
    startSaving(async () => {
      if (await persistDraft(draftBeingSaved)) startDownload(downloadUrl)
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
  const carouselZipUrl = `/api/studio/posts/${postId}/export`
  const selectedSlidePngUrl = `/api/studio/posts/${postId}/slides/${selectedSlideIndex + 1}?download=1`

  return (
    <div className="flex flex-col xl:h-dvh">
      <div className="sticky top-0 z-20 flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-background/95 px-6 py-3 backdrop-blur md:px-10 xl:static xl:px-6">
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
          <DropdownMenuTrigger render={<Button variant="outline" />}>
            <PaletteIcon data-icon="inline-start" />
            Identidade visual
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuItem onClick={() => applyIdentityToAllSlides(SURPRISE_IDENTITY_KEY)}>
              <ShuffleIcon />
              Surpreenda-me
            </DropdownMenuItem>
            {VISUAL_IDENTITIES.map((identity) => (
              <DropdownMenuItem key={identity.key} onClick={() => applyIdentityToAllSlides(identity.key)} className="items-start">
                <IdentitySwatches identityKey={identity.key} />
                <span className="flex flex-col">
                  <span>{identity.label}</span>
                  <span className="text-xs text-muted-foreground">{identity.description}</span>
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" onClick={saveDraft} disabled={isSaving || !hasUnsavedChanges}>
          <SaveIcon data-icon="inline-start" />
          {isSaving ? "Salvando…" : "Salvar"}
        </Button>

        <div className="flex items-center">
          <Button onClick={() => saveAndDownload(carouselZipUrl)} disabled={isSaving} className="rounded-r-none">
            <FileArchiveIcon data-icon="inline-start" />
            {hasUnsavedChanges ? "Salvar e baixar" : "Baixar carrossel"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button size="icon" disabled={isSaving} className="rounded-l-none border-l border-primary-foreground/20" />}
              aria-label="Mais opções de download"
            >
              <ChevronDownIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => saveAndDownload(carouselZipUrl)}>
                <FileArchiveIcon />
                Todos os slides + legenda (.zip)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => saveAndDownload(selectedSlidePngUrl)}>
                <DownloadIcon />
                Só o slide {selectedSlideIndex + 1} (.png)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-8 px-6 py-8 md:px-10 xl:min-h-0 xl:flex-1 xl:grid-cols-[216px_minmax(0,1fr)_384px] xl:grid-rows-[minmax(0,1fr)] xl:gap-0 xl:p-0">
        <section
          aria-label="Slides"
          className="relative flex flex-col gap-3 xl:scrollbar-thin xl:overflow-y-auto xl:overscroll-contain xl:border-r xl:border-border xl:p-4"
        >
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
          <ol className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin xl:flex-col xl:overflow-x-visible xl:pb-0">
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
                      carouselAlbumIds={carouselAlbumIds}
                      slideNumber={slideIndex + 1}
                      slideCount={draft.slides.length}
                      displayWidth={168}
                      highlightFontKey={highlightFontKey}
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

        <div className="relative flex min-w-0 flex-col gap-8 xl:scrollbar-thin xl:overflow-y-auto xl:overscroll-contain xl:px-10 xl:py-8">
          <section aria-label="Prévia do slide" className="flex flex-col items-center gap-4">
            <SlidePreview
              slide={selectedSlide}
              albumsById={albumsById}
              carouselAlbumIds={carouselAlbumIds}
              slideNumber={selectedSlideIndex + 1}
              slideCount={draft.slides.length}
              displayWidth={432}
              highlightFontKey={highlightFontKey}
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

          <Tabs defaultValue="caption" className="w-full gap-6 border-t border-border pt-6">
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
                      carouselAlbumIds={carouselAlbumIds}
                      slideNumber={slideIndex + 1}
                      slideCount={draft.slides.length}
                      displayWidth={200}
                      highlightFontKey={highlightFontKey}
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
                    <li>Clique em <span className="font-medium text-foreground">Baixar carrossel</span>. O .zip traz os slides e a legenda.</li>
                    <li>Publique manualmente pelo app do Instagram.</li>
                    <li>Volte aqui e marque como <Badge variant="secondary">Publicada</Badge>.</li>
                  </ol>
                </div>
              </FieldGroup>
            </TabsContent>
          </Tabs>
        </div>

        <section
          aria-label="Editar slide"
          className="relative flex flex-col gap-4 rounded-xl border border-border bg-card p-5 xl:scrollbar-thin xl:overflow-y-auto xl:overscroll-contain xl:rounded-none xl:border-0 xl:border-l xl:p-6"
        >
          <h2 className="text-sm font-medium">
            Slide {selectedSlideIndex + 1} de {draft.slides.length}
          </h2>
          <SlideInspector
            key={selectedSlide.id}
            slide={selectedSlide}
            albums={albums}
            carouselAlbumCount={carouselAlbumIds.length}
            uploadedImages={uploadedImages}
            onChange={updateSelectedSlide}
            onImageUploaded={(image) => setUploadedImages((currentImages) => [image, ...currentImages])}
            onApplyToAllSlides={applyToAllSlides}
            onDefaultBackgroundChanged={markImageAsDefaultBackground}
          />
        </section>
      </div>
    </div>
  )
}
