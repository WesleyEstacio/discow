"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { PlusIcon, SearchIcon, SparklesIcon, XIcon } from "lucide-react"
import { FormSubmitButton } from "@/components/studio/form-submit-button"
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

  return (
    <form action={formAction} className="flex flex-col gap-12">
      <input type="hidden" name="language" value={language} />
      <input type="hidden" name="backgroundImageId" value={backgroundImageId} />

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

      <section aria-labelledby="step-albums" className="flex flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">Etapa 2</p>
            <h2 id="step-albums" className="font-heading text-2xl font-semibold tracking-tight">Selecionar músicas</h2>
          </div>
          <Link
            href={`/studio/music/search?returnTo=/studio/create/${template.key}`}
            className="inline-flex items-center gap-2 rounded-md text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <SearchIcon className="size-4" aria-hidden="true" />
            Buscar e salvar um álbum novo
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
                  <h3 id={`slot-group-${section.group.key}`} className="font-heading text-lg font-semibold">
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
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">Etapa 3</p>
          <h2 id="step-settings" className="font-heading text-2xl font-semibold tracking-tight">Textos e visual</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Só o que estiver marcado como obrigatório precisa ser preenchido. Depois de gerar, cada texto continua editável no
            editor, slide por slide.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,42rem)_minmax(0,18rem)]">
          <FieldGroup>
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

            <DefaultBackgroundPicker
              images={defaultBackgroundImages}
              selectedImageId={backgroundImageId}
              onSelectImage={setBackgroundImageId}
            />
          </FieldGroup>

          <aside aria-labelledby="slide-structure-title" className="flex h-fit flex-col gap-3 rounded-xl border border-border bg-card p-5">
            <h3 id="slide-structure-title" className="text-sm font-medium">Como o carrossel fica</h3>
            <ol className="flex flex-col gap-2 text-sm text-muted-foreground">
              {template.slideStructure.map((step, stepIndex) => (
                <li key={step} className="flex gap-2">
                  <span className="font-medium text-foreground tabular-nums">{stepIndex + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>

      <div className="flex flex-col gap-3 border-t border-border pt-6">
        <p className="text-sm text-muted-foreground">
          O carrossel é montado com os dados reais dos álbuns. Textos editoriais que ainda faltam ficam em branco ou
          entre colchetes para você escrever no editor.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <FormSubmitButton pendingLabel="Montando carrossel…">
            <SparklesIcon data-icon="inline-start" />
            Gerar carrossel
          </FormSubmitButton>
          {formState.message ? (
            <p role="alert" className="text-sm text-destructive">
              {formState.message}
            </p>
          ) : null}
        </div>
      </div>
    </form>
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
    <FieldSet className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <FieldLegend className="mb-0">{slot.label}</FieldLegend>
          <FieldDescription>
            {slot.description} Selecionados: {selectedAlbumIds.length}/{slot.maxAlbums}.
          </FieldDescription>
        </div>
        <Input
          type="search"
          aria-label={`Filtrar álbuns para ${slot.label}`}
          placeholder="Filtrar por título, artista, gênero, tag ou ano"
          value={filterText}
          onChange={(event) => setFilterText(event.target.value)}
          className={cn("w-full", !isCompact && "sm:w-80")}
        />
      </div>

      {selectedAlbumIds.map((albumId) => (
        <input key={albumId} type="hidden" name={`slot:${slot.key}`} value={albumId} />
      ))}

      <ul
        className={cn(
          "grid max-h-[28rem] grid-cols-2 gap-3 overflow-y-auto rounded-xl border border-border p-3 sm:grid-cols-3",
          isCompact ? "xl:grid-cols-4" : "lg:grid-cols-4 xl:grid-cols-6"
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
                  "relative flex cursor-pointer flex-col gap-2 rounded-lg border border-transparent p-2 transition-colors hover:bg-muted/60 has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                  isSelected && "border-primary bg-primary/10",
                  (isUsedElsewhere || isAtLimit) && "cursor-not-allowed opacity-45"
                )}
              >
                {slot.isOrdered && selectionPosition > 0 ? (
                  <Badge className="absolute top-3 left-3 z-10 tabular-nums" aria-label={`Posição ${selectionPosition}`}>
                    {selectionPosition}º
                  </Badge>
                ) : null}
                <StudioCoverImage coverImageUrl={album.coverImageUrl} albumTitle={album.title} className="w-full" />
                <span className="flex items-start gap-2">
                  <Checkbox
                    id={checkboxId}
                    checked={isSelected}
                    disabled={isUsedElsewhere || isAtLimit}
                    onCheckedChange={(isChecked) => onToggleAlbum(album.id, isChecked)}
                    className="mt-0.5"
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="line-clamp-2 text-sm font-medium leading-snug">{album.title}</span>
                    <span className="truncate text-xs text-muted-foreground">{album.artistNames.join(", ")}</span>
                  </span>
                  {isSortingByColor && album.dominantColorHex ? (
                    <span
                      className="ml-auto size-3 shrink-0 rounded-full border border-border"
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
          <li className="col-span-full p-4 text-sm text-muted-foreground">Nenhum álbum encontrado.</li>
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
      <div className="flex flex-wrap items-center gap-2">
        <FieldLabel htmlFor={inputId}>
          {field.label}
          {field.required ? <span className="text-muted-foreground"> (obrigatório)</span> : null}
        </FieldLabel>
        {field.appearsIn ? <Badge variant="secondary">Aparece em: {field.appearsIn}</Badge> : null}
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
      <div className="flex flex-wrap items-center gap-2">
        <FieldLegend variant="label" className="mb-0">Imagem de fundo (opcional)</FieldLegend>
        <Badge variant="secondary">Aparece em: todos os slides</Badge>
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
