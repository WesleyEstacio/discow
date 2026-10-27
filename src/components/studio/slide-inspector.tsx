"use client"

import { useState } from "react"
import { AlignCenterIcon, AlignLeftIcon, XIcon } from "lucide-react"
import { StudioCoverImage } from "@/components/studio/studio-cover-image"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  MAX_ALBUMS_PER_GRID_SLIDE,
  SLIDE_BACKGROUND_KEYS,
  SLIDE_BACKGROUNDS,
  SLIDE_LAYOUT_LABELS,
  SLIDE_LAYOUTS,
  SLIDE_TEXT_LIMITS,
  type SlideLayout,
  type StudioSlide,
} from "@/lib/studio/slides"
import { cn } from "@/lib/utils"

export type EditorAlbumOption = {
  id: string
  title: string
  artistNames: string[]
  releaseYear: number | null
  coverImageUrl: string | null
  editorialDescription: string
}

type SlideInspectorProps = {
  slide: StudioSlide
  albums: EditorAlbumOption[]
  onChange: (patch: Partial<StudioSlide>) => void
}

function maxAlbumsForLayout(layout: SlideLayout): number {
  if (layout === "album") return 1
  if (layout === "album-grid") return MAX_ALBUMS_PER_GRID_SLIDE
  return 0
}

function CharacterCounter({ length, limit }: { length: number; limit: number }) {
  const isOverLimit = length > limit
  return (
    <span className={cn("ml-auto text-xs tabular-nums", isOverLimit ? "font-medium text-destructive" : "text-muted-foreground")}>
      {length}/{limit}
    </span>
  )
}

export function SlideInspector({ slide, albums, onChange }: SlideInspectorProps) {
  const limits = SLIDE_TEXT_LIMITS[slide.layout]
  const maxAlbums = maxAlbumsForLayout(slide.layout)

  function changeLayout(nextLayout: SlideLayout) {
    onChange({ layout: nextLayout, albumIds: slide.albumIds.slice(0, maxAlbumsForLayout(nextLayout)) })
  }

  return (
    <FieldGroup className="gap-5">
      <Field>
        <FieldLabel htmlFor="slide-layout">Layout</FieldLabel>
        <Select value={slide.layout} onValueChange={(value) => changeLayout(value as SlideLayout)}>
          <SelectTrigger id="slide-layout" className="w-full">
            <SelectValue>{(value: SlideLayout) => SLIDE_LAYOUT_LABELS[value]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SLIDE_LAYOUTS.map((layout) => (
              <SelectItem key={layout} value={layout}>
                {SLIDE_LAYOUT_LABELS[layout]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <div className="flex items-center gap-2">
          <FieldLabel htmlFor="slide-kicker">Rótulo</FieldLabel>
          <CharacterCounter length={slide.kicker.length} limit={limits.kicker} />
        </div>
        <Input id="slide-kicker" value={slide.kicker} onChange={(event) => onChange({ kicker: event.target.value })} />
      </Field>

      <Field>
        <div className="flex items-center gap-2">
          <FieldLabel htmlFor="slide-headline">Título</FieldLabel>
          <CharacterCounter length={slide.headline.length} limit={limits.headline} />
        </div>
        <Textarea id="slide-headline" rows={2} value={slide.headline} onChange={(event) => onChange({ headline: event.target.value })} />
        {slide.layout === "album" ? (
          <FieldDescription>Vazio = usa o título do álbum.</FieldDescription>
        ) : null}
      </Field>

      {slide.layout !== "album-grid" ? (
        <Field>
          <div className="flex items-center gap-2">
            <FieldLabel htmlFor="slide-body">Texto</FieldLabel>
            <CharacterCounter length={slide.body.length} limit={limits.body} />
          </div>
          <Textarea id="slide-body" rows={5} value={slide.body} onChange={(event) => onChange({ body: event.target.value })} />
        </Field>
      ) : null}

      {maxAlbums > 0 ? (
        <SlideAlbumPicker
          albums={albums}
          selectedAlbumIds={slide.albumIds}
          maxAlbums={maxAlbums}
          onChange={(albumIds) => onChange({ albumIds })}
          onUseDescription={slide.layout === "album" ? (description) => onChange({ body: description }) : undefined}
        />
      ) : null}

      <Field>
        <FieldLabel>Fundo</FieldLabel>
        <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Cor de fundo">
          {SLIDE_BACKGROUND_KEYS.map((backgroundKey) => {
            const isSelected = !slide.customBackgroundHex && slide.backgroundKey === backgroundKey
            return (
              <button
                key={backgroundKey}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={SLIDE_BACKGROUNDS[backgroundKey].label}
                title={SLIDE_BACKGROUNDS[backgroundKey].label}
                onClick={() => onChange({ backgroundKey, customBackgroundHex: null })}
                className={cn(
                  "size-8 rounded-full border border-border outline-none transition-transform focus-visible:ring-3 focus-visible:ring-ring/50",
                  isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
                style={{ backgroundColor: SLIDE_BACKGROUNDS[backgroundKey].background }}
              />
            )
          })}
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="color"
              aria-label="Cor personalizada"
              value={slide.customBackgroundHex ?? "#c2268f"}
              onChange={(event) => onChange({ customBackgroundHex: event.target.value })}
              className={cn(
                "h-8 w-10 cursor-pointer rounded-md border border-input bg-transparent p-0.5",
                slide.customBackgroundHex && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
            />
            Personalizada
          </label>
        </div>
      </Field>

      <Field>
        <FieldLabel>Alinhamento</FieldLabel>
        <ToggleGroup
          variant="outline"
          size="sm"
          value={[slide.textAlign]}
          onValueChange={(values) => {
            const nextAlignment = values[0]
            if (nextAlignment === "left" || nextAlignment === "center") onChange({ textAlign: nextAlignment })
          }}
          aria-label="Alinhamento do texto"
        >
          <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
            <AlignLeftIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Centralizar">
            <AlignCenterIcon />
          </ToggleGroupItem>
        </ToggleGroup>
      </Field>
    </FieldGroup>
  )
}

type SlideAlbumPickerProps = {
  albums: EditorAlbumOption[]
  selectedAlbumIds: string[]
  maxAlbums: number
  onChange: (albumIds: string[]) => void
  onUseDescription?: (description: string) => void
}

function SlideAlbumPicker({ albums, selectedAlbumIds, maxAlbums, onChange, onUseDescription }: SlideAlbumPickerProps) {
  const [filterText, setFilterText] = useState("")
  const albumsById = new Map(albums.map((album) => [album.id, album]))
  const normalizedFilter = filterText.trim().toLowerCase()
  const matchingAlbums = normalizedFilter
    ? albums
        .filter((album) => !selectedAlbumIds.includes(album.id))
        .filter((album) => `${album.title} ${album.artistNames.join(" ")}`.toLowerCase().includes(normalizedFilter))
        .slice(0, 8)
    : []
  const canAddMore = selectedAlbumIds.length < maxAlbums

  function addAlbum(albumId: string) {
    onChange(maxAlbums === 1 ? [albumId] : [...selectedAlbumIds, albumId].slice(0, maxAlbums))
    setFilterText("")
  }

  return (
    <Field>
      <FieldLabel htmlFor="slide-album-filter">
        {maxAlbums === 1 ? "Álbum" : `Álbuns (${selectedAlbumIds.length}/${maxAlbums})`}
      </FieldLabel>

      <ul className="flex flex-col gap-2">
        {selectedAlbumIds.map((albumId) => {
          const album = albumsById.get(albumId)
          return (
            <li key={albumId} className="flex items-center gap-3 rounded-lg border border-border p-2">
              <StudioCoverImage coverImageUrl={album?.coverImageUrl ?? null} albumTitle={album?.title ?? "Álbum removido"} className="size-10" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{album?.title ?? "Álbum removido da biblioteca"}</span>
                <span className="truncate text-xs text-muted-foreground">{album?.artistNames.join(", ")}</span>
                {onUseDescription && album?.editorialDescription ? (
                  <button
                    type="button"
                    onClick={() => onUseDescription(album.editorialDescription)}
                    className="w-fit rounded-sm text-xs text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    Usar descrição da biblioteca
                  </button>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remover ${album?.title ?? "álbum"} do slide`}
                onClick={() => onChange(selectedAlbumIds.filter((selectedId) => selectedId !== albumId))}
              >
                <XIcon />
              </Button>
            </li>
          )
        })}
      </ul>

      {canAddMore || maxAlbums === 1 ? (
        <>
          <Input
            id="slide-album-filter"
            type="search"
            placeholder={maxAlbums === 1 && selectedAlbumIds.length ? "Trocar por outro álbum…" : "Buscar na biblioteca…"}
            value={filterText}
            onChange={(event) => setFilterText(event.target.value)}
          />
          {matchingAlbums.length ? (
            <ul className="flex flex-col gap-1 rounded-lg border border-border p-1">
              {matchingAlbums.map((album) => (
                <li key={album.id}>
                  <button
                    type="button"
                    onClick={() => addAlbum(album.id)}
                    className="flex w-full items-center gap-3 rounded-md p-1.5 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <StudioCoverImage coverImageUrl={album.coverImageUrl} albumTitle={album.title} className="size-9" />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm">{album.title}</span>
                      <span className="truncate text-xs text-muted-foreground">{album.artistNames.join(", ")}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : normalizedFilter ? (
            <FieldDescription>Nenhum álbum com esse nome na biblioteca.</FieldDescription>
          ) : null}
        </>
      ) : null}
    </Field>
  )
}
