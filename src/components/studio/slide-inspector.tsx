"use client"

import { useState } from "react"
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  CopyCheckIcon,
  RotateCcwIcon,
  ShuffleIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react"
import { HighlightableTextarea } from "@/components/studio/highlightable-textarea"
import { SlideBackgroundImageField } from "@/components/studio/slide-background-image-field"
import { StudioCoverImage } from "@/components/studio/studio-cover-image"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { StudioImageSummary } from "@/lib/studio/background-images"
import {
  resolveFontFamily,
  SLIDE_TEXT_ELEMENT_LABELS,
  SLIDE_TEXT_ELEMENTS,
  STUDIO_FONT_KEYS,
  STUDIO_FONTS,
  type SlideFonts,
} from "@/lib/studio/studio-fonts"
import {
  BACKGROUND_STYLE_LABELS,
  BACKGROUND_STYLES,
  CONTENT_POSITION_LABELS,
  COVER_ECHO_ANCHOR_LABELS,
  COVER_ECHO_ANCHORS,
  COVER_GRID_TILT_LABELS,
  COVER_GRID_TILTS,
  CTA_RECAP_POSITION_LABELS,
  CTA_RECAP_POSITIONS,
  CONTENT_POSITIONS,
  HEADLINE_SIZE_LABELS,
  HEADLINE_SIZES,
  KICKER_STYLE_LABELS,
  KICKER_STYLES,
  MAX_ALBUM_COVER_RADIUS_PERCENT,
  MAX_ALBUMS_BY_LAYOUT,
  MAX_BACKGROUND_SEED,
  pickSlideElementToggles,
  pickSlideFonts,
  PROGRESS_ALIGNMENT_LABELS,
  PROGRESS_ALIGNMENTS,
  PROGRESS_SIZE_LABELS,
  PROGRESS_SIZES,
  readableTextColorFor,
  resolveSecondaryBackgroundColor,
  resolveSlideColors,
  resolveSlideComposition,
  SLIDE_BACKGROUND_KEYS,
  SLIDE_BACKGROUNDS,
  SLIDE_COMPOSITION_LABELS,
  SLIDE_COMPOSITIONS_BY_LAYOUT,
  isTextDrivenComposition,
  SLIDE_ELEMENT_TOGGLE_LABELS,
  SLIDE_ELEMENT_TOGGLES,
  SLIDE_LAYOUT_LABELS,
  SLIDE_LAYOUTS,
  SLIDE_TEXT_LIMITS,
  TYPE_STYLE_LABELS,
  TYPE_STYLES,
  type ContentPosition,
  type ProgressAlignment,
  type SlideComposition,
  type SlideElementToggle,
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
  carouselAlbumCount: number
  uploadedImages: StudioImageSummary[]
  onChange: (patch: Partial<StudioSlide>) => void
  onImageUploaded: (image: StudioImageSummary) => void
  onApplyToAllSlides: (patch: Partial<StudioSlide>, confirmationMessage: string) => void
  onDefaultBackgroundChanged: (imageId: string, isDefaultBackground: boolean) => void
}

const LAYOUTS_WITH_SOURCE_NOTE = new Set<SlideLayout>(["album", "ranked-album", "text", "quote"])

const PROGRESS_ALIGNMENT_ICONS: Record<ProgressAlignment, LucideIcon> = {
  left: AlignLeftIcon,
  center: AlignCenterIcon,
  right: AlignRightIcon,
}


const BODY_LABELS: Partial<Record<SlideLayout, string>> = {
  quote: "Autor da citação",
  "album-pair": "Texto de apoio (opcional)",
}

function CharacterCounter({ length, limit }: { length: number; limit: number }) {
  const isOverLimit = length > limit
  return (
    <span className={cn("ml-auto text-xs tabular-nums", isOverLimit ? "font-medium text-destructive" : "text-muted-foreground")}>
      {length}/{limit}
    </span>
  )
}

function readNumberInput(value: string): number | null {
  const parsedNumber = Number.parseInt(value, 10)
  if (!Number.isInteger(parsedNumber)) return null
  return Math.min(99, Math.max(1, parsedNumber))
}

export function SlideInspector({
  slide,
  albums,
  carouselAlbumCount,
  uploadedImages,
  onChange,
  onImageUploaded,
  onApplyToAllSlides,
  onDefaultBackgroundChanged,
}: SlideInspectorProps) {
  const limits = SLIDE_TEXT_LIMITS[slide.layout]
  const maxAlbums = MAX_ALBUMS_BY_LAYOUT[slide.layout]
  const currentColors = resolveSlideColors(slide)
  const currentAccentColor = currentColors.accent
  const availableCompositions: readonly SlideComposition[] = SLIDE_COMPOSITIONS_BY_LAYOUT[slide.layout]
  const usesGiantPairWords = slide.layout === "album-pair" && isTextDrivenComposition(resolveSlideComposition(slide))
  const showsCtaCovers = slide.layout === "cta" && resolveSlideComposition(slide) !== "minimal"
  const pairLabelNoun = usesGiantPairWords ? "Palavra gigante" : "Rótulo"

  function changeLayout(nextLayout: SlideLayout) {
    onChange({
      layout: nextLayout,
      albumIds: slide.albumIds.slice(0, MAX_ALBUMS_BY_LAYOUT[nextLayout]),
      composition: SLIDE_COMPOSITIONS_BY_LAYOUT[nextLayout][0],
    })
  }

  return (
    <FieldGroup className="gap-6">
      <FieldSet className="gap-5">
        <FieldLegend variant="label" className="sr-only">Conteúdo</FieldLegend>
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

        {availableCompositions.length > 1 ? (
          <OptionToggleField
            label="Composição"
            options={availableCompositions}
            optionLabels={SLIDE_COMPOSITION_LABELS}
            value={resolveSlideComposition(slide)}
            onChange={(composition) => onChange({ composition })}
          />
        ) : null}

        {showsCtaCovers ? (
          <OptionToggleField
            label="Posição das capas"
            options={CTA_RECAP_POSITIONS}
            optionLabels={CTA_RECAP_POSITION_LABELS}
            value={slide.ctaRecapPosition}
            onChange={(ctaRecapPosition) => onChange({ ctaRecapPosition })}
          />
        ) : null}

        {slide.layout === "cta" && resolveSlideComposition(slide) === "grid" ? (
          <div className="flex flex-col gap-2">
            <OptionToggleField
              label="Inclinação da grade"
              options={COVER_GRID_TILTS}
              optionLabels={COVER_GRID_TILT_LABELS}
              value={slide.coverGridTilt}
              onChange={(coverGridTilt) => onChange({ coverGridTilt })}
            />
            <FieldDescription>
              Mostra as capas dos álbuns do carrossel (até 6) e um espaço com “?”. Em “Para os lados”, as colunas da esquerda tombam para a esquerda e as da direita para a direita.
            </FieldDescription>
          </div>
        ) : null}

        <Field>
          <div className="flex items-center gap-2">
            <FieldLabel htmlFor="slide-kicker">{slide.layout === "album-pair" ? `${pairLabelNoun} do primeiro álbum` : "Rótulo"}</FieldLabel>
            <CharacterCounter length={slide.kicker.length} limit={limits.kicker} />
          </div>
          <Input id="slide-kicker" value={slide.kicker} onChange={(event) => onChange({ kicker: event.target.value })} />
        </Field>

        {slide.layout === "album-pair" ? (
          <Field>
            <div className="flex items-center gap-2">
              <FieldLabel htmlFor="slide-headline">{`${pairLabelNoun} do segundo álbum`}</FieldLabel>
              <CharacterCounter length={slide.headline.length} limit={limits.headline} />
            </div>
            <Input id="slide-headline" value={slide.headline} onChange={(event) => onChange({ headline: event.target.value })} />
            <FieldDescription>Os nomes dos álbuns e artistas entram sozinhos, na ordem dos álbuns escolhidos abaixo.</FieldDescription>
          </Field>
        ) : (
          <Field>
            <div className="flex items-center gap-2">
              <FieldLabel htmlFor="slide-headline">{slide.layout === "quote" ? "Citação" : "Título"}</FieldLabel>
              <CharacterCounter length={slide.headline.length} limit={limits.headline} />
            </div>
            <HighlightableTextarea
              id="slide-headline"
              rows={slide.layout === "quote" ? 4 : 2}
              value={slide.headline}
              onValueChange={(headline) => onChange({ headline })}
            />
            <FieldDescription>
              {slide.layout === "album" || slide.layout === "ranked-album" ? "Vazio = usa o título do álbum. " : ""}
              Selecione uma palavra ou frase e clique em &ldquo;Destacar seleção&rdquo; para usar a fonte do destaque nela.
            </FieldDescription>
          </Field>
        )}

        {limits.body > 0 ? (
          <Field>
            <div className="flex items-center gap-2">
              <FieldLabel htmlFor="slide-body">{BODY_LABELS[slide.layout] ?? "Texto"}</FieldLabel>
              <CharacterCounter length={slide.body.length} limit={limits.body} />
            </div>
            {slide.layout === "quote" ? (
              <Input id="slide-body" value={slide.body} onChange={(event) => onChange({ body: event.target.value })} />
            ) : (
              <HighlightableTextarea id="slide-body" rows={5} value={slide.body} onValueChange={(body) => onChange({ body })} />
            )}
          </Field>
        ) : null}

        {slide.layout === "ranked-album" || slide.layout === "album-list" ? (
          <Field>
            <FieldLabel htmlFor="slide-rank-number">{slide.layout === "ranked-album" ? "Posição no ranking" : "Numerar a partir de"}</FieldLabel>
            <Input
              id="slide-rank-number"
              type="number"
              inputMode="numeric"
              min={1}
              max={99}
              className="w-28"
              value={slide.rankNumber ?? ""}
              onChange={(event) => onChange({ rankNumber: readNumberInput(event.target.value) })}
            />
            {slide.layout === "album-list" ? <FieldDescription>Vazio = lista sem números.</FieldDescription> : null}
          </Field>
        ) : null}

        {LAYOUTS_WITH_SOURCE_NOTE.has(slide.layout) || slide.requiresSource ? (
          <Field>
            <FieldLabel htmlFor="slide-source">
              Fonte{slide.requiresSource ? <span className="text-muted-foreground"> (obrigatória)</span> : null}
            </FieldLabel>
            <Input
              id="slide-source"
              placeholder="Ex.: entrevista à Rolling Stone, 1998"
              value={slide.sourceNote}
              onChange={(event) => onChange({ sourceNote: event.target.value })}
            />
            <Field orientation="horizontal" className="mt-1">
              <Checkbox
                id="slide-requires-source"
                checked={slide.requiresSource}
                onCheckedChange={(isChecked) => onChange({ requiresSource: isChecked })}
              />
              <FieldLabel htmlFor="slide-requires-source" className="font-normal">
                Sinalizar se estiver sem fonte
              </FieldLabel>
            </Field>
          </Field>
        ) : null}

        {maxAlbums > 0 ? (
          <SlideAlbumPicker
            albums={albums}
            selectedAlbumIds={slide.albumIds}
            maxAlbums={maxAlbums}
            onChange={(albumIds) => onChange({ albumIds })}
            onUseDescription={
              slide.layout === "album" || slide.layout === "ranked-album" ? (description) => onChange({ body: description }) : undefined
            }
          />
        ) : null}
      </FieldSet>

      <FieldSeparator />

      <FieldSet className="gap-5">
        <FieldLegend variant="label">Visual</FieldLegend>

        <Field>
          <FieldLabel>Cor de fundo</FieldLabel>
          <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Cor de fundo">
            {SLIDE_BACKGROUND_KEYS.map((backgroundKey) => {
              const isSelected = !slide.customBackgroundHex && slide.backgroundKey === backgroundKey
              return (
                <ColorSwatchButton
                  key={backgroundKey}
                  label={SLIDE_BACKGROUNDS[backgroundKey].label}
                  color={SLIDE_BACKGROUNDS[backgroundKey].background}
                  isSelected={isSelected}
                  onSelect={() => onChange({ backgroundKey, customBackgroundHex: null })}
                />
              )
            })}
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="color"
                aria-label="Cor de fundo personalizada"
                value={slide.customBackgroundHex ?? "#c2268f"}
                onChange={(event) => onChange({ customBackgroundHex: event.target.value })}
                className={cn(
                  "h-8 w-10 cursor-pointer rounded-md border border-input bg-transparent p-0.5",
                  slide.customBackgroundHex && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
              />
              Outra
            </label>
          </div>
        </Field>

        <Field>
          <FieldLabel>Textura do fundo</FieldLabel>
          <ToggleGroup
            variant="outline"
            size="sm"
            value={[slide.backgroundStyle]}
            onValueChange={(values) => {
              const nextStyle = BACKGROUND_STYLES.find((style) => style === values[0])
              if (nextStyle) onChange({ backgroundStyle: nextStyle })
            }}
            aria-label="Textura do fundo"
            className="flex-wrap"
          >
            {BACKGROUND_STYLES.map((style) => (
              <ToggleGroupItem key={style} value={style}>
                {BACKGROUND_STYLE_LABELS[style]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {slide.backgroundStyle === "blurred-covers" ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChange({ backgroundSeed: (slide.backgroundSeed + 1) % (MAX_BACKGROUND_SEED + 1) })}
                disabled={carouselAlbumCount === 0}
              >
                <ShuffleIcon data-icon="inline-start" />
                Embaralhar capas
              </Button>
              <FieldDescription>
                {carouselAlbumCount === 0
                  ? "Adicione álbuns ao carrossel para gerar o fundo."
                  : "Mistura as capas de todos os álbuns do carrossel, espalhadas e bem desfocadas."}
              </FieldDescription>
            </div>
          ) : null}
        </Field>

        {slide.backgroundStyle === "cover-echo" ? (
          <div className="flex flex-col gap-2">
            <OptionToggleField
              label="Posição da capa"
              options={COVER_ECHO_ANCHORS}
              optionLabels={COVER_ECHO_ANCHOR_LABELS}
              value={slide.coverEchoAnchor}
              onChange={(coverEchoAnchor) => onChange({ coverEchoAnchor })}
            />
            <FieldDescription>
              Usa o primeiro álbum do slide (ou do carrossel). Com a posição do conteúdo em Automático, o texto vai para o lado oposto ao da capa.
            </FieldDescription>
          </div>
        ) : null}

        {slide.backgroundStyle === "two-tone" ? (
          <SecondaryBackgroundField
            secondaryBackgroundHex={slide.secondaryBackgroundHex}
            automaticColor={resolveSecondaryBackgroundColor({ ...slide, secondaryBackgroundHex: null }, currentColors)}
            primaryBackgroundColor={currentColors.background}
            onChange={(secondaryBackgroundHex) => onChange({ secondaryBackgroundHex })}
            onApplyToAllSlides={() =>
              onApplyToAllSlides(
                { backgroundStyle: "two-tone", secondaryBackgroundHex: slide.secondaryBackgroundHex },
                "Fundo em duas cores aplicado a todos os slides"
              )
            }
          />
        ) : null}

        <OverridableColorField
          id="slide-accent"
          label="Cor de destaque"
          color={currentAccentColor}
          fallbackColor="#e879c9"
          isOverridden={slide.accentHex !== null}
          automaticHint="Rótulo, números e detalhes"
          resetLabel="Usar a cor do tema"
          onChange={(accentHex) => onChange({ accentHex })}
        />

        <OverridableColorField
          id="slide-text-color"
          label="Cor do texto"
          color={currentColors.text}
          fallbackColor="#f7f5fa"
          isOverridden={slide.customTextHex !== null}
          automaticHint="Automática, com contraste pelo fundo"
          resetLabel="Usar a cor automática"
          onChange={(customTextHex) => onChange({ customTextHex })}
        />

        {slide.layout === "cta" ? (
          <OverridableColorField
            id="slide-cta-button-color"
            label="Cor do botão do site"
            color={slide.ctaButtonHex ?? currentColors.text}
            fallbackColor="#f7f5fa"
            isOverridden={slide.ctaButtonHex !== null}
            automaticHint="Segue a cor do texto"
            resetLabel="Seguir a cor do texto"
            onChange={(ctaButtonHex) => onChange({ ctaButtonHex })}
          />
        ) : null}

        {showsCtaCovers ? (
          <OverridableColorField
            id="slide-cta-empty-slot-color"
            label="Cor do espaço vazio (+ / ?)"
            color={slide.ctaEmptySlotHex ?? currentColors.text}
            fallbackColor="#f7f5fa"
            isOverridden={slide.ctaEmptySlotHex !== null}
            automaticHint="Segue a cor do texto"
            resetLabel="Seguir a cor do texto"
            onChange={(ctaEmptySlotHex) => onChange({ ctaEmptySlotHex })}
          />
        ) : null}

        {usesGiantPairWords ? (
          <>
            <OverridableColorField
              id="slide-first-pair-word-color"
              label="Cor da primeira palavra gigante"
              color={slide.firstPairWordHex ?? currentColors.text}
              fallbackColor="#f7f5fa"
              isOverridden={slide.firstPairWordHex !== null}
              automaticHint="Segue a cor do texto"
              resetLabel="Seguir a cor do texto"
              onChange={(firstPairWordHex) => onChange({ firstPairWordHex })}
            />

            <OverridableColorField
              id="slide-second-pair-word-color"
              label="Cor da segunda palavra gigante"
              color={slide.secondPairWordHex ?? currentAccentColor}
              fallbackColor="#e879c9"
              isOverridden={slide.secondPairWordHex !== null}
              automaticHint="Segue a cor de destaque"
              resetLabel="Seguir a cor de destaque"
              onChange={(secondPairWordHex) => onChange({ secondPairWordHex })}
            />

            <Field orientation="horizontal">
              <Checkbox
                id="slide-pair-word-shadow"
                checked={slide.showPairWordShadow}
                onCheckedChange={(isChecked) => onChange({ showPairWordShadow: isChecked })}
              />
              <FieldLabel htmlFor="slide-pair-word-shadow" className="font-normal">
                Brilho atrás das palavras gigantes
              </FieldLabel>
            </Field>
          </>
        ) : null}

        <OptionToggleField
          label="Estilo do título"
          options={TYPE_STYLES}
          optionLabels={TYPE_STYLE_LABELS}
          value={slide.typeStyle}
          onChange={(typeStyle) => onChange({ typeStyle })}
        />

        <OptionToggleField
          label="Estilo do rótulo"
          options={KICKER_STYLES}
          optionLabels={KICKER_STYLE_LABELS}
          value={slide.kickerStyle}
          onChange={(kickerStyle) => onChange({ kickerStyle })}
        />

        <SlideFontsField
          fonts={slide.fonts}
          onChange={(fonts) => onChange({ fonts })}
          onApplyToAllSlides={() => onApplyToAllSlides(pickSlideFonts(slide), "Fontes aplicadas a todos os slides")}
        />

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel>Tamanho do título</FieldLabel>
            <ToggleGroup
              variant="outline"
              size="sm"
              value={[slide.headlineSize]}
              onValueChange={(values) => {
                const nextSize = HEADLINE_SIZES.find((size) => size === values[0])
                if (nextSize) onChange({ headlineSize: nextSize })
              }}
              aria-label="Tamanho do título"
            >
              {HEADLINE_SIZES.map((size) => (
                <ToggleGroupItem key={size} value={size} aria-label={`Título ${HEADLINE_SIZE_LABELS[size]}`}>
                  {HEADLINE_SIZE_LABELS[size]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
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
        </div>

        {maxAlbums > 0 ? (
          <Field>
            <div className="flex items-center justify-between gap-2">
              <FieldLabel>Arredondamento das capas</FieldLabel>
              <span className="text-xs text-muted-foreground tabular-nums">
                {slide.albumCoverRadius === 0 ? "Reto" : slide.albumCoverRadius === MAX_ALBUM_COVER_RADIUS_PERCENT ? "Círculo" : `${slide.albumCoverRadius}%`}
              </span>
            </div>
            <Slider
              aria-label="Arredondamento das capas dos álbuns"
              min={0}
              max={MAX_ALBUM_COVER_RADIUS_PERCENT}
              step={1}
              value={[slide.albumCoverRadius]}
              onValueChange={(value) => onChange({ albumCoverRadius: typeof value === "number" ? value : (value[0] ?? 0) })}
            />
            <Button
              variant="ghost"
              size="sm"
              className="w-fit"
              onClick={() =>
                onApplyToAllSlides({ albumCoverRadius: slide.albumCoverRadius }, "Arredondamento aplicado a todos os slides")
              }
            >
              <CopyCheckIcon data-icon="inline-start" />
              Usar em todos os slides
            </Button>
          </Field>
        ) : null}

        <Field>
          <FieldLabel htmlFor="slide-content-position">Posição do conteúdo</FieldLabel>
          <Select value={slide.contentPosition} onValueChange={(value) => onChange({ contentPosition: value as ContentPosition })}>
            <SelectTrigger id="slide-content-position" className="w-full">
              <SelectValue>{(value: ContentPosition) => CONTENT_POSITION_LABELS[value]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {CONTENT_POSITIONS.map((position) => (
                <SelectItem key={position} value={position}>
                  {CONTENT_POSITION_LABELS[position]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </FieldSet>

      <FieldSeparator />

      <FieldSet className="gap-3">
        <FieldLegend variant="label">Elementos do slide</FieldLegend>
        {SLIDE_ELEMENT_TOGGLES.map((elementToggle) => (
          <Field key={elementToggle} orientation="horizontal">
            <Checkbox
              id={`slide-${elementToggle}`}
              checked={slide[elementToggle]}
              onCheckedChange={(isChecked) => {
                const togglePatch: Partial<Pick<StudioSlide, SlideElementToggle>> = {}
                togglePatch[elementToggle] = isChecked
                onChange(togglePatch)
              }}
            />
            <FieldLabel htmlFor={`slide-${elementToggle}`} className="font-normal">
              {SLIDE_ELEMENT_TOGGLE_LABELS[elementToggle]}
            </FieldLabel>
          </Field>
        ))}
        {slide.showProgress ? (
          <div className="grid grid-cols-2 gap-4 pt-1">
            <Field>
              <FieldLabel>Posição do contador</FieldLabel>
              <ToggleGroup
                variant="outline"
                size="sm"
                value={[slide.progressAlignment]}
                onValueChange={(values) => {
                  const nextAlignment = PROGRESS_ALIGNMENTS.find((alignment) => alignment === values[0])
                  if (nextAlignment) onChange({ progressAlignment: nextAlignment })
                }}
                aria-label="Posição do contador de páginas"
              >
                {PROGRESS_ALIGNMENTS.map((alignment) => {
                  const AlignmentIcon = PROGRESS_ALIGNMENT_ICONS[alignment]
                  return (
                    <ToggleGroupItem key={alignment} value={alignment} aria-label={`Contador: ${PROGRESS_ALIGNMENT_LABELS[alignment]}`}>
                      <AlignmentIcon />
                    </ToggleGroupItem>
                  )
                })}
              </ToggleGroup>
            </Field>
            <Field>
              <FieldLabel>Tamanho do contador</FieldLabel>
              <ToggleGroup
                variant="outline"
                size="sm"
                value={[slide.progressSize]}
                onValueChange={(values) => {
                  const nextSize = PROGRESS_SIZES.find((size) => size === values[0])
                  if (nextSize) onChange({ progressSize: nextSize })
                }}
                aria-label="Tamanho do contador de páginas"
              >
                {PROGRESS_SIZES.map((size) => (
                  <ToggleGroupItem key={size} value={size} aria-label={`Contador ${PROGRESS_SIZE_LABELS[size]}`}>
                    {PROGRESS_SIZE_LABELS[size]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
          </div>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          className="w-fit"
          onClick={() =>
            onApplyToAllSlides(pickSlideElementToggles(slide), "Elementos aplicados a todos os slides")
          }
        >
          <CopyCheckIcon data-icon="inline-start" />
          Usar em todos os slides
        </Button>
      </FieldSet>

      <FieldSeparator />

      <SlideBackgroundImageField
        backgroundImage={slide.backgroundImage}
        uploadedImages={uploadedImages}
        onChange={(backgroundImage) => onChange({ backgroundImage })}
        onImageUploaded={onImageUploaded}
        onApplyToAllSlides={() =>
          onApplyToAllSlides(
            { backgroundImage: slide.backgroundImage },
            slide.backgroundImage ? "Fundo aplicado a todos os slides" : "Fundo removido de todos os slides"
          )
        }
        onDefaultBackgroundChanged={onDefaultBackgroundChanged}
      />
    </FieldGroup>
  )
}

function SlideFontsField({
  fonts,
  onChange,
  onApplyToAllSlides,
}: {
  fonts: SlideFonts
  onChange: (fonts: SlideFonts) => void
  onApplyToAllSlides: () => void
}) {
  return (
    <Field>
      <FieldLabel>Fontes</FieldLabel>
      <div className="flex flex-col gap-2">
        {SLIDE_TEXT_ELEMENTS.map((element) => (
          <div key={element} className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">{SLIDE_TEXT_ELEMENT_LABELS[element]}</span>
            <ToggleGroup
              variant="outline"
              size="sm"
              value={[fonts[element]]}
              onValueChange={(values) => {
                const nextFontKey = STUDIO_FONT_KEYS.find((fontKey) => fontKey === values[0])
                if (nextFontKey) onChange({ ...fonts, [element]: nextFontKey })
              }}
              aria-label={`Fonte: ${SLIDE_TEXT_ELEMENT_LABELS[element]}`}
            >
              {STUDIO_FONT_KEYS.map((fontKey) => (
                <ToggleGroupItem key={fontKey} value={fontKey} style={{ fontFamily: resolveFontFamily(fontKey, "preview") }}>
                  {STUDIO_FONTS[fontKey].label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        ))}
      </div>
      <FieldDescription>
        Para trocar a fonte de uma palavra só, selecione-a no título ou no texto e clique em &ldquo;Destacar seleção&rdquo;.
      </FieldDescription>
      <Button variant="ghost" size="sm" className="w-fit" onClick={onApplyToAllSlides}>
        <CopyCheckIcon data-icon="inline-start" />
        Usar estas fontes em todos os slides
      </Button>
    </Field>
  )
}

function OverridableColorField({
  id,
  label,
  color,
  fallbackColor,
  isOverridden,
  automaticHint,
  resetLabel,
  onChange,
}: {
  id: string
  label: string
  color: string
  fallbackColor: string
  isOverridden: boolean
  automaticHint: string
  resetLabel: string
  onChange: (hexColor: string | null) => void
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={color.startsWith("#") ? color : fallbackColor}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-10 cursor-pointer rounded-md border border-input bg-transparent p-0.5"
        />
        {isOverridden ? (
          <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
            <RotateCcwIcon data-icon="inline-start" />
            {resetLabel}
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">{automaticHint}</span>
        )}
      </div>
    </Field>
  )
}

function ColorSwatchButton({
  label,
  color,
  isSelected,
  onSelect,
}: {
  label: string
  color: string
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-label={label}
      title={label}
      onClick={onSelect}
      className={cn(
        "size-8 rounded-full border border-border outline-none transition-transform focus-visible:ring-3 focus-visible:ring-ring/50",
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
      style={{ backgroundColor: color }}
    />
  )
}

function SecondaryBackgroundField({
  secondaryBackgroundHex,
  automaticColor,
  primaryBackgroundColor,
  onChange,
  onApplyToAllSlides,
}: {
  secondaryBackgroundHex: string | null
  automaticColor: string
  primaryBackgroundColor: string
  onChange: (secondaryBackgroundHex: string | null) => void
  onApplyToAllSlides: () => void
}) {
  const paletteColors: string[] = SLIDE_BACKGROUND_KEYS.map((backgroundKey) => SLIDE_BACKGROUNDS[backgroundKey].background)
  const isPaletteColorSelected = secondaryBackgroundHex !== null && paletteColors.includes(secondaryBackgroundHex)
  const isCustomColorSelected = secondaryBackgroundHex !== null && !isPaletteColorSelected
  const secondaryColorHurtsTextContrast =
    secondaryBackgroundHex !== null && readableTextColorFor(secondaryBackgroundHex) !== readableTextColorFor(primaryBackgroundColor)

  return (
    <Field>
      <FieldLabel>Segunda cor do fundo</FieldLabel>
      <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Segunda cor do fundo">
        <ColorSwatchButton
          label="Automática (tom da cor de destaque)"
          color={automaticColor}
          isSelected={secondaryBackgroundHex === null}
          onSelect={() => onChange(null)}
        />
        {SLIDE_BACKGROUND_KEYS.map((backgroundKey) => (
          <ColorSwatchButton
            key={backgroundKey}
            label={SLIDE_BACKGROUNDS[backgroundKey].label}
            color={SLIDE_BACKGROUNDS[backgroundKey].background}
            isSelected={secondaryBackgroundHex === SLIDE_BACKGROUNDS[backgroundKey].background}
            onSelect={() => onChange(SLIDE_BACKGROUNDS[backgroundKey].background)}
          />
        ))}
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="color"
            aria-label="Segunda cor personalizada"
            value={secondaryBackgroundHex ?? automaticColor}
            onChange={(event) => onChange(event.target.value)}
            className={cn(
              "h-8 w-10 cursor-pointer rounded-md border border-input bg-transparent p-0.5",
              isCustomColorSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
            )}
          />
          Outra
        </label>
      </div>
      <FieldDescription>
        {secondaryColorHurtsTextContrast
          ? "Atenção: essa cor tem brilho oposto ao do fundo, então o texto que cair sobre ela pode ficar ilegível. Prefira um tom tão claro ou tão escuro quanto o fundo."
          : "A primeira bolinha é automática: um tom da cor de destaque sobre o fundo."}
      </FieldDescription>
      <Button variant="ghost" size="sm" className="w-fit" onClick={onApplyToAllSlides}>
        <CopyCheckIcon data-icon="inline-start" />
        Usar em todos os slides
      </Button>
    </Field>
  )
}

type SlideAlbumPickerProps = {
  albums: EditorAlbumOption[]
  selectedAlbumIds: string[]
  maxAlbums: number
  onChange: (albumIds: string[]) => void
  onUseDescription?: (description: string) => void
}

function moveAlbum(albumIds: string[], fromIndex: number, toIndex: number): string[] {
  if (toIndex < 0 || toIndex >= albumIds.length) return albumIds
  const reorderedAlbumIds = [...albumIds]
  const [movedAlbumId] = reorderedAlbumIds.splice(fromIndex, 1)
  reorderedAlbumIds.splice(toIndex, 0, movedAlbumId!)
  return reorderedAlbumIds
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
        {selectedAlbumIds.map((albumId, albumIndex) => {
          const album = albumsById.get(albumId)
          const albumName = album?.title ?? "álbum"
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
              {maxAlbums > 1 ? (
                <div className="flex">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Mover ${albumName} para cima`}
                    disabled={albumIndex === 0}
                    onClick={() => onChange(moveAlbum(selectedAlbumIds, albumIndex, albumIndex - 1))}
                  >
                    <ArrowUpIcon />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Mover ${albumName} para baixo`}
                    disabled={albumIndex === selectedAlbumIds.length - 1}
                    onClick={() => onChange(moveAlbum(selectedAlbumIds, albumIndex, albumIndex + 1))}
                  >
                    <ArrowDownIcon />
                  </Button>
                </div>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remover ${albumName} do slide`}
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

function OptionToggleField<Option extends string>({
  label,
  options,
  optionLabels,
  value,
  onChange,
}: {
  label: string
  options: readonly Option[]
  optionLabels: Record<Option, string>
  value: Option
  onChange: (option: Option) => void
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <ToggleGroup
        variant="outline"
        size="sm"
        className="flex-wrap"
        value={[value]}
        onValueChange={(values) => {
          const nextOption = options.find((option) => option === values[0])
          if (nextOption) onChange(nextOption)
        }}
        aria-label={label}
      >
        {options.map((option) => (
          <ToggleGroupItem key={option} value={option}>
            {optionLabels[option]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Field>
  )
}
