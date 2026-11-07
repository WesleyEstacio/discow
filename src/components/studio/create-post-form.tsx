"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { ArrowRightIcon, PlusIcon, SearchIcon, ShuffleIcon, XIcon } from "lucide-react"
import { FormSubmitButton } from "@/components/studio/form-submit-button"
import { IdentitySwatches } from "@/components/studio/identity-swatches"
import { StudioCoverImage } from "@/components/studio/studio-cover-image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { colorDistance } from "@/lib/studio/color-distance"
import type { StudioImageSummary } from "@/lib/studio/background-images"
import type { CreatePostFormState } from "@/lib/studio/post-actions"
import { POST_LANGUAGE_LABELS, POST_LANGUAGES, type PostLanguage } from "@/lib/studio/post-status"
import { studioImageUrl } from "@/lib/studio/slides"
import type { TemplateAlbumSlot, TemplateAlbumSlotGroup, TemplateSettingField } from "@/lib/studio/templates/types"
import { SURPRISE_IDENTITY_KEY, VISUAL_IDENTITIES } from "@/lib/studio/visual-identities"
import { cn } from "@/lib/utils"

export type CreatePostAlbumOption = {
  id: string
  title: string
  artistNames: string[]
  releaseYear: number | null
  coverImageUrl: string | null
  dominantColorHex: string | null
  genres: string[]
  tags: string[]
}

type CreatePostFormProps = {
  template: {
    key: string
    slideStructure: string[]
    defaultIdentityKey: string
    albumSlots: TemplateAlbumSlot[]
    settingFields: TemplateSettingField[]
  }
  albums: CreatePostAlbumOption[]
  defaultBackgroundImages: StudioImageSummary[]
  action: (state: CreatePostFormState, formData: FormData) => Promise<CreatePostFormState>
}

const INITIAL_CREATE_POST_STATE: CreatePostFormState = { message: null }

type AlbumSlotSection = {
  group: TemplateAlbumSlotGroup | null
  slots: TemplateAlbumSlot[]
  isOptional: boolean
}

function groupSlotsIntoSections(albumSlots: TemplateAlbumSlot[]): AlbumSlotSection[] {
  const sections: AlbumSlotSection[] = []
  for (const slot of albumSlots) {
    const previousSection = sections.at(-1)
    if (slot.group && previousSection?.group?.key === slot.group.key) {
      previousSection.slots.push(slot)
      previousSection.isOptional &&= slot.minAlbums === 0
    } else {
      sections.push({ group: slot.group ?? null, slots: [slot], isOptional: Boolean(slot.group) && slot.minAlbums === 0 })
    }
  }
  return sections
}

function matchesAlbumFilter(album: CreatePostAlbumOption, filterText: string): boolean {
  const normalizedFilter = filterText.trim().toLowerCase()
  if (!normalizedFilter) return true
  return [album.title, ...album.artistNames, ...album.genres, ...album.tags, String(album.releaseYear ?? "")]
    .join(" ")
    .toLowerCase()
    .includes(normalizedFilter)
}

export function CreatePostForm({ template, albums, defaultBackgroundImages, action }: CreatePostFormProps) {
  const [formState, formAction] = useActionState(action, INITIAL_CREATE_POST_STATE)
  const [language, setLanguage] = useState<PostLanguage>("pt")
  const [selectedAlbumIdsBySlot, setSelectedAlbumIdsBySlot] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(template.albumSlots.map((slot) => [slot.key, []]))
  )
  const [visibleOptionalSectionCount, setVisibleOptionalSectionCount] = useState(0)
  const [backgroundImageId, setBackgroundImageId] = useState("")
  const [visualIdentityKey, setVisualIdentityKey] = useState(SURPRISE_IDENTITY_KEY)
  const [settingValues, setSettingValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(template.settingFields.map((field) => [field.key, field.defaultValue ?? ""]))
  )

  function toggleAlbumInSlot(slot: TemplateAlbumSlot, albumId: string, isChecked: boolean) {
    setSelectedAlbumIdsBySlot((currentSelection) => {
      const slotSelection = currentSelection[slot.key] ?? []
      const nextSlotSelection = isChecked
        ? slot.maxAlbums === 1
          ? [albumId]
          : [...slotSelection, albumId].slice(0, slot.maxAlbums)
        : slotSelection.filter((selectedId) => selectedId !== albumId)
      return { ...currentSelection, [slot.key]: nextSlotSelection }
    })
  }

  const albumIdsUsedInOtherSlots = (slotKey: string) =>
    new Set(
      Object.entries(selectedAlbumIdsBySlot)
        .filter(([otherSlotKey]) => otherSlotKey !== slotKey)
        .flatMap(([, albumIds]) => albumIds)
    )

  const slotSections = groupSlotsIntoSections(template.albumSlots)
  const optionalSections = slotSections.filter((section) => section.isOptional)
  const visibleSections = slotSections.filter(
    (section) => !section.isOptional || optionalSections.indexOf(section) < visibleOptionalSectionCount
  )
  const nextHiddenOptionalSection = optionalSections[visibleOptionalSectionCount]
  const lastVisibleOptionalSection = optionalSections[visibleOptionalSectionCount - 1]

  function hideLastOptionalSection() {
    if (!lastVisibleOptionalSection) return
    setSelectedAlbumIdsBySlot((currentSelection) => ({
      ...currentSelection,
      ...Object.fromEntries(lastVisibleOptionalSection.slots.map((slot) => [slot.key, []])),
    }))
    setVisibleOptionalSectionCount((currentCount) => currentCount - 1)
  }

  function renderSlotPicker(slot: TemplateAlbumSlot, isCompact: boolean) {
    return (
      <AlbumSlotPicker
        key={slot.key}
        slot={slot}
        albums={albums}
        isCompact={isCompact}
        selectedAlbumIds={selectedAlbumIdsBySlot[slot.key] ?? []}
        disabledAlbumIds={albumIdsUsedInOtherSlots(slot.key)}
        sortByColorHex={slot.sortByColorSetting ? settingValues[slot.sortByColorSetting] : undefined}
        onToggleAlbum={(albumId, isChecked) => toggleAlbumInSlot(slot, albumId, isChecked)}
      />
    )
  }

  const albumsById = new Map(albums.map((album) => [album.id, album]))
  const visibleSlots = visibleSections.flatMap((section) => section.slots)

  return (
    <form action={formAction} className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
      <input type="hidden" name="language" value={language} />
      <input type="hidden" name="backgroundImageId" value={backgroundImageId} />
      <input type="hidden" name="visualIdentity" value={visualIdentityKey} />

      <div className="flex min-w-0 flex-col gap-12">
        {albums.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Sua biblioteca musical ainda está vazia.{" "}
            <Link
              href={`/studio/music/search?returnTo=/studio/create/${template.key}`}
              className="font-medium text-foreground underline underline-offset-4"
            >
              Busque e salve álbuns
            </Link>{" "}
            para montar o carrossel.
          </div>
        ) : null}

        <section aria-labelledby="step-albums" className="flex flex-col gap-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <StepHeading stepNumber={2} headingId="step-albums" title="Escolha os álbuns" />
            <Link
              href={`/studio/music/search?returnTo=/studio/create/${template.key}`}
              className="inline-flex items-center gap-2 rounded-md text-sm text-muted-foreground underline-offset-4 outline-none transition-colors hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <SearchIcon className="size-4" aria-hidden="true" />
              Buscar um álbum novo
            </Link>
          </div>

          {visibleSections.map((section) =>
            section.group ? (
              <section
                key={section.group.key}
                aria-labelledby={`slot-group-${section.group.key}`}
                className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <h3 id={`slot-group-${section.group.key}`} className="font-heading text-base font-semibold">
                      {section.group.label}
                    </h3>
                    {section.group.description ? (
                      <p className="text-sm text-muted-foreground">{section.group.description}</p>
                    ) : null}
                  </div>
                  {section === lastVisibleOptionalSection ? (
                    <Button type="button" variant="ghost" size="sm" onClick={hideLastOptionalSection}>
                      <XIcon data-icon="inline-start" />
                      Remover {section.group.label.toLowerCase()}
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-6 lg:grid-cols-2">{section.slots.map((slot) => renderSlotPicker(slot, true))}</div>
              </section>
            ) : (
              section.slots.map((slot) => renderSlotPicker(slot, false))
            )
          )}

          {nextHiddenOptionalSection?.group ? (
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              onClick={() => setVisibleOptionalSectionCount((currentCount) => currentCount + 1)}
            >
              <PlusIcon data-icon="inline-start" />
              Adicionar {nextHiddenOptionalSection.group.label.toLowerCase()}
            </Button>
          ) : null}
        </section>

        <section aria-labelledby="step-settings" className="flex flex-col gap-6">
          <StepHeading
            stepNumber={3}
            headingId="step-settings"
            title="Textos e visual"
            description="Só o que está marcado como obrigatório precisa ser preenchido. Depois de gerar, cada texto continua editável, slide por slide."
          />

          <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-5 md:p-6">
            <FieldGroup className="max-w-2xl">
              <Field>
                <FieldLabel htmlFor="post-language">Idioma</FieldLabel>
                <Select value={language} onValueChange={(value) => setLanguage(value as PostLanguage)}>
                  <SelectTrigger id="post-language" className="w-48">
                    <SelectValue>{(value: PostLanguage) => POST_LANGUAGE_LABELS[value]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {POST_LANGUAGES.map((languageOption) => (
                      <SelectItem key={languageOption} value={languageOption}>
                        {POST_LANGUAGE_LABELS[languageOption]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {template.settingFields.map((field) => (
                <SettingInput
                  key={field.key}
                  field={field}
                  value={settingValues[field.key] ?? ""}
                  onChange={(value) => setSettingValues((currentValues) => ({ ...currentValues, [field.key]: value }))}
                />
              ))}
            </FieldGroup>
          </div>

          <div className="flex flex-col gap-8 rounded-xl border border-border bg-card p-5 md:p-6">
            <VisualIdentityPicker
              selectedIdentityKey={visualIdentityKey}
              suggestedIdentityKey={template.defaultIdentityKey}
              onSelectIdentity={setVisualIdentityKey}
            />

            <DefaultBackgroundPicker
              images={defaultBackgroundImages}
              selectedImageId={backgroundImageId}
              onSelectImage={setBackgroundImageId}
            />
          </div>
        </section>
      </div>

      <aside
        aria-labelledby="carousel-summary-title"
        className="flex flex-col gap-6 rounded-xl border border-border bg-card p-5 xl:sticky xl:top-8 xl:max-h-[calc(100dvh-4rem)] xl:scrollbar-thin xl:overflow-y-auto"
      >
        <h2 id="carousel-summary-title" className="font-heading text-base font-semibold">Seu carrossel</h2>

        <ul className="flex flex-col gap-4">
          {visibleSlots.map((slot) => {
            const selectedAlbums = (selectedAlbumIdsBySlot[slot.key] ?? []).flatMap((albumId) => albumsById.get(albumId) ?? [])
            return (
              <li key={slot.key} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate">{slot.label}</span>
                  <span
                    className={cn(
                      "shrink-0 font-mono text-xs tabular-nums",
                      selectedAlbums.length > 0 && selectedAlbums.length >= slot.minAlbums ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {selectedAlbums.length}/{slot.maxAlbums}
                  </span>
                </div>
                {selectedAlbums.length ? (
                  <ul className="flex flex-wrap gap-1.5">
                    {selectedAlbums.map((album) => (
                      <li key={album.id} className="w-11">
                        <StudioCoverImage coverImageUrl={album.coverImageUrl} albumTitle={album.title} className="w-full rounded-sm" />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {slot.minAlbums > 0 ? `Escolha pelo menos ${slot.minAlbums}` : "Opcional"}
                  </p>
                )}
              </li>
            )
          })}
        </ul>

        <div className="flex flex-col gap-2 border-t border-border pt-5">
          <h3 className="text-sm font-medium">Estrutura</h3>
          <ol className="flex flex-col gap-1 text-sm text-muted-foreground">
            {template.slideStructure.map((step, stepIndex) => (
              <li key={step} className="flex gap-3">
                <span className="w-5 shrink-0 font-mono text-xs leading-5 tabular-nums">{String(stepIndex + 1).padStart(2, "0")}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-5">
          <FormSubmitButton pendingLabel="Montando carrossel…" size="lg" className="w-full">
            Gerar carrossel
            <ArrowRightIcon data-icon="inline-end" />
          </FormSubmitButton>
          {formState.message ? (
            <p role="alert" className="text-sm text-destructive">
              {formState.message}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Os textos que dependem de pesquisa saem entre colchetes para você completar no editor.
          </p>
        </div>
      </aside>
    </form>
  )
}

function StepHeading({
  stepNumber,
  headingId,
  title,
  description,
}: {
  stepNumber: number
  headingId: string
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-sm text-muted-foreground tabular-nums" aria-hidden="true">
          {String(stepNumber).padStart(2, "0")}
        </span>
        <h2 id={headingId} className="font-heading text-xl font-semibold tracking-tight">
          {title}
        </h2>
      </div>
      {description ? <p className="max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
    </div>
  )
}

type AlbumSlotPickerProps = {
  slot: TemplateAlbumSlot
  albums: CreatePostAlbumOption[]
  isCompact: boolean
  selectedAlbumIds: string[]
  disabledAlbumIds: Set<string>
  sortByColorHex: string | undefined
  onToggleAlbum: (albumId: string, isChecked: boolean) => void
}

function AlbumSlotPicker({
  slot,
  albums,
  isCompact,
  selectedAlbumIds,
  disabledAlbumIds,
  sortByColorHex,
  onToggleAlbum,
}: AlbumSlotPickerProps) {
  const [filterText, setFilterText] = useState("")
  const isSortingByColor = Boolean(sortByColorHex && /^#[0-9a-fA-F]{6}$/.test(sortByColorHex))

  const visibleAlbums = albums
    .filter((album) => selectedAlbumIds.includes(album.id) || matchesAlbumFilter(album, filterText))
    .toSorted((firstAlbum, secondAlbum) => {
      if (!isSortingByColor || !sortByColorHex) return 0
      const firstDistance = firstAlbum.dominantColorHex ? colorDistance(firstAlbum.dominantColorHex, sortByColorHex) : Infinity
      const secondDistance = secondAlbum.dominantColorHex ? colorDistance(secondAlbum.dominantColorHex, sortByColorHex) : Infinity
      return firstDistance - secondDistance
    })

  return (
    <FieldSet className={cn("flex flex-col gap-4", !isCompact && "rounded-xl border border-border bg-card p-5")}>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-baseline gap-3">
            <FieldLegend className="mb-0">{slot.label}</FieldLegend>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {selectedAlbumIds.length}/{slot.maxAlbums}
            </span>
          </div>
          <FieldDescription>{slot.description}</FieldDescription>
        </div>
        <div className={cn("relative w-full", !isCompact && "sm:w-72")}>
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label={`Filtrar álbuns para ${slot.label}`}
            placeholder="Título, artista, gênero ou ano"
            value={filterText}
            onChange={(event) => setFilterText(event.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {selectedAlbumIds.map((albumId) => (
        <input key={albumId} type="hidden" name={`slot:${slot.key}`} value={albumId} />
      ))}

      <ul
        className={cn(
          "-mx-1 grid max-h-[26rem] scrollbar-thin grid-cols-2 gap-x-3 gap-y-4 overflow-y-auto px-1 py-1 sm:grid-cols-3",
          isCompact ? "xl:grid-cols-4" : "lg:grid-cols-4 2xl:grid-cols-6"
        )}
      >
        {visibleAlbums.map((album) => {
          const isSelected = selectedAlbumIds.includes(album.id)
          const isUsedElsewhere = disabledAlbumIds.has(album.id)
          const isAtLimit = !isSelected && slot.maxAlbums > 1 && selectedAlbumIds.length >= slot.maxAlbums
          const checkboxId = `${slot.key}-${album.id}`
          const selectionPosition = selectedAlbumIds.indexOf(album.id) + 1
          return (
            <li key={album.id}>
              <label
                htmlFor={checkboxId}
                className={cn(
                  "group/album flex cursor-pointer flex-col gap-2 rounded-lg outline-none",
                  (isUsedElsewhere || isAtLimit) && "cursor-not-allowed opacity-40"
                )}
              >
                <span
                  className={cn(
                    "relative block rounded-md ring-1 ring-border transition-[box-shadow,opacity] group-hover/album:opacity-90 group-has-focus-visible/album:ring-3 group-has-focus-visible/album:ring-ring/50",
                    isSelected && "ring-2 ring-primary"
                  )}
                >
                  <StudioCoverImage coverImageUrl={album.coverImageUrl} albumTitle={album.title} className="w-full" />
                  <Checkbox
                    id={checkboxId}
                    checked={isSelected}
                    disabled={isUsedElsewhere || isAtLimit}
                    onCheckedChange={(isChecked) => onToggleAlbum(album.id, isChecked)}
                    className={cn(
                      "absolute top-2 right-2 bg-background/90 shadow-sm transition-opacity focus-visible:opacity-100",
                      !isSelected && "opacity-0 group-hover/album:opacity-100"
                    )}
                  />
                  {slot.isOrdered && selectionPosition > 0 ? (
                    <span
                      className="absolute top-2 left-2 rounded-sm bg-primary px-1.5 py-0.5 font-mono text-xs font-medium text-primary-foreground tabular-nums"
                      aria-label={`Posição ${selectionPosition}`}
                    >
                      {String(selectionPosition).padStart(2, "0")}
                    </span>
                  ) : null}
                </span>
                <span className="flex items-start gap-2">
                  <span className="flex min-w-0 flex-col">
                    <span className="line-clamp-2 text-sm leading-snug font-medium">{album.title}</span>
                    <span className="truncate text-xs text-muted-foreground">{album.artistNames.join(", ")}</span>
                  </span>
                  {isSortingByColor && album.dominantColorHex ? (
                    <span
                      className="mt-1 ml-auto size-3 shrink-0 rounded-full ring-1 ring-border"
                      style={{ backgroundColor: album.dominantColorHex }}
                      title={`Cor predominante ${album.dominantColorHex}`}
                    />
                  ) : null}
                </span>
              </label>
            </li>
          )
        })}
        {visibleAlbums.length === 0 ? (
          <li className="col-span-full py-6 text-sm text-muted-foreground">Nenhum álbum encontrado</li>
        ) : null}
      </ul>
    </FieldSet>
  )
}

function SettingInput({
  field,
  value,
  onChange,
}: {
  field: TemplateSettingField
  value: string
  onChange: (value: string) => void
}) {
  const inputId = `setting-${field.key}`
  const inputName = `setting:${field.key}`

  return (
    <Field>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <FieldLabel htmlFor={inputId}>
          {field.label}
          {field.required ? <span className="font-normal text-muted-foreground"> · obrigatório</span> : null}
        </FieldLabel>
        {field.appearsIn ? <AppearsIn location={field.appearsIn} /> : null}
      </div>
      {field.kind === "textarea" ? (
        <Textarea id={inputId} name={inputName} value={value} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} />
      ) : field.kind === "select" ? (
        <>
          <input type="hidden" name={inputName} value={value} />
          <Select value={value} onValueChange={(nextValue) => onChange(String(nextValue))}>
            <SelectTrigger id={inputId} className="w-full sm:w-96">
              <SelectValue>
                {(selectedValue: string) => field.options?.find((option) => option.value === selectedValue)?.label ?? selectedValue}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      ) : field.kind === "color" ? (
        <div className="flex items-center gap-3">
          <input
            id={inputId}
            name={inputName}
            type="color"
            value={value || "#c2268f"}
            onChange={(event) => onChange(event.target.value)}
            className="h-10 w-16 cursor-pointer rounded-md border border-input bg-transparent p-1"
          />
          <span className="font-mono text-sm text-muted-foreground">{value}</span>
        </div>
      ) : (
        <Input id={inputId} name={inputName} value={value} placeholder={field.placeholder} required={field.required} onChange={(event) => onChange(event.target.value)} />
      )}
      {field.description ? <FieldDescription>{field.description}</FieldDescription> : null}
    </Field>
  )
}

function AppearsIn({ location }: { location: string }) {
  return <span className="text-xs text-muted-foreground">Aparece em: {location}</span>
}

type DefaultBackgroundPickerProps = {
  images: StudioImageSummary[]
  selectedImageId: string
  onSelectImage: (imageId: string) => void
}

function DefaultBackgroundPicker({ images, selectedImageId, onSelectImage }: DefaultBackgroundPickerProps) {
  const backgroundOptions = [
    { id: "", label: "Sem imagem" },
    ...images.map((image, imageIndex) => ({ id: image.id, label: `Fundo padrão ${imageIndex + 1}` })),
  ]

  return (
    <FieldSet>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <FieldLegend variant="label" className="mb-0">Imagem de fundo (opcional)</FieldLegend>
        <AppearsIn location="todos os slides" />
      </div>
      {images.length ? (
        <>
          <div role="radiogroup" aria-label="Imagem de fundo" className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {backgroundOptions.map((option) => {
              const isSelected = option.id === selectedImageId
              return (
                <button
                  key={option.id || "none"}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={option.label}
                  onClick={() => onSelectImage(option.id)}
                  className={cn(
                    "flex aspect-[4/5] items-center justify-center overflow-hidden rounded-md border border-border p-1 text-center text-xs text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    option.id && "p-0",
                    isSelected && "ring-2 ring-primary"
                  )}
                >
                  {option.id ? (
                    // eslint-disable-next-line @next/next/no-img-element -- admin-only route, already sized
                    <img src={studioImageUrl(option.id)} alt="" loading="lazy" className="size-full object-cover" />
                  ) : (
                    option.label
                  )}
                </button>
              )
            })}
          </div>
          <FieldDescription>Opacidade, filtro e desfoque podem ser ajustados no editor.</FieldDescription>
        </>
      ) : (
        <FieldDescription>
          Nenhum fundo padrão ainda. No editor, envie uma imagem e marque a estrela para guardá-la para os próximos posts.
        </FieldDescription>
      )}
    </FieldSet>
  )
}

type VisualIdentityPickerProps = {
  selectedIdentityKey: string
  suggestedIdentityKey: string
  onSelectIdentity: (identityKey: string) => void
}

function VisualIdentityPicker({ selectedIdentityKey, suggestedIdentityKey, onSelectIdentity }: VisualIdentityPickerProps) {
  const identityOptions = [
    { key: SURPRISE_IDENTITY_KEY, label: "Surpresa", description: "Sorteia uma identidade diferente a cada post." },
    ...VISUAL_IDENTITIES.map((identity) => ({ key: identity.key, label: identity.label, description: identity.description })),
  ]

  return (
    <FieldSet>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <FieldLegend variant="label" className="mb-0">Identidade visual</FieldLegend>
        <AppearsIn location="cores, capa e arranjo de todos os slides" />
      </div>
      <div role="radiogroup" aria-label="Identidade visual" className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
        {identityOptions.map((option) => {
          const isSelected = option.key === selectedIdentityKey
          return (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectIdentity(option.key)}
              className={cn(
                "flex items-start gap-3 rounded-lg border border-border p-3 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50",
                isSelected && "border-primary bg-primary/10"
              )}
            >
              {option.key === SURPRISE_IDENTITY_KEY ? (
                <ShuffleIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              ) : (
                <IdentitySwatches identityKey={option.key} />
              )}
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {option.label}
                  {option.key === suggestedIdentityKey ? <Badge variant="outline">Sugerida</Badge> : null}
                </span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </span>
            </button>
          )
        })}
      </div>
      <FieldDescription>Textos e capas também variam a cada post. Dá para trocar a identidade depois no editor.</FieldDescription>
    </FieldSet>
  )
}
