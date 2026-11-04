"use client"

import { useId, useTransition, type ChangeEvent } from "react"
import { CopyCheckIcon, ImageUpIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Slider } from "@/components/ui/slider"
import { toast } from "@/components/ui/toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { StudioImageSummary } from "@/lib/studio/background-images"
import {
  BACKGROUND_IMAGE_FILTER_CSS,
  BACKGROUND_IMAGE_FILTER_LABELS,
  BACKGROUND_IMAGE_FILTERS,
  BACKGROUND_IMAGE_POSITION_LABELS,
  BACKGROUND_IMAGE_POSITIONS,
  DEFAULT_BACKGROUND_IMAGE_SETTINGS,
  MAX_BACKGROUND_IMAGE_BLUR,
  studioImageUrl,
  type BackgroundImageFilter,
  type BackgroundImagePosition,
  type SlideBackgroundImage,
} from "@/lib/studio/slides"
import { cn } from "@/lib/utils"

const UPLOAD_MAX_DIMENSION = 2160

type SlideBackgroundImageFieldProps = {
  backgroundImage: SlideBackgroundImage | null
  uploadedImages: StudioImageSummary[]
  onChange: (backgroundImage: SlideBackgroundImage | null) => void
  onImageUploaded: (image: StudioImageSummary) => void
  onApplyToAllSlides: () => void
}

// Phone photos are often larger than the upload limit, so they are scaled
// down in the browser first. The server still re-encodes and validates them.
async function downscaleImageForUpload(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
  const scale = Math.min(1, UPLOAD_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Falha ao converter a imagem"))), "image/jpeg", 0.9)
  })
}

async function uploadBackgroundImage(file: File): Promise<StudioImageSummary> {
  const formData = new FormData()
  formData.append("image", await downscaleImageForUpload(file), "fundo.jpg")
  const response = await fetch("/api/studio/images", { method: "POST", body: formData })
  const responseBody: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const errorMessage =
      responseBody && typeof responseBody === "object" && "error" in responseBody && typeof responseBody.error === "string"
        ? responseBody.error
        : "Não foi possível enviar a imagem."
    throw new Error(errorMessage)
  }
  return responseBody as StudioImageSummary
}

function readSliderValue(value: number | readonly number[]): number {
  return typeof value === "number" ? value : (value[0] ?? 0)
}

export function SlideBackgroundImageField({
  backgroundImage,
  uploadedImages,
  onChange,
  onImageUploaded,
  onApplyToAllSlides,
}: SlideBackgroundImageFieldProps) {
  const fileInputId = useId()
  const [isUploading, startUploading] = useTransition()

  function selectImage(imageId: string) {
    onChange({ ...(backgroundImage ?? DEFAULT_BACKGROUND_IMAGE_SETTINGS), imageId })
  }

  function updateSettings(patch: Partial<SlideBackgroundImage>) {
    if (backgroundImage) onChange({ ...backgroundImage, ...patch })
  }

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0]
    event.target.value = ""
    if (!selectedFile) return

    startUploading(async () => {
      try {
        const uploadedImage = await uploadBackgroundImage(selectedFile)
        onImageUploaded(uploadedImage)
        selectImage(uploadedImage.id)
      } catch (error) {
        toast.add({
          title: "Não foi possível enviar a imagem",
          description: error instanceof Error ? error.message : undefined,
          type: "error",
        })
      }
    })
  }

  return (
    <FieldSet className="gap-4">
      <FieldLegend variant="label">Imagem de fundo</FieldLegend>

      <div className="flex flex-wrap items-center gap-2">
        <input id={fileInputId} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleFileSelected} disabled={isUploading} />
        <Button variant="outline" size="sm" render={<label htmlFor={fileInputId} />} nativeButton={false} disabled={isUploading}>
          <ImageUpIcon data-icon="inline-start" />
          {isUploading ? "Enviando…" : backgroundImage ? "Trocar imagem" : "Enviar imagem"}
        </Button>
        {backgroundImage ? (
          <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
            <Trash2Icon data-icon="inline-start" />
            Remover
          </Button>
        ) : null}
      </div>

      {uploadedImages.length ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">Imagens já enviadas</p>
          <ul className="grid grid-cols-6 gap-1.5">
            {uploadedImages.map((image) => {
              const isSelected = backgroundImage?.imageId === image.id
              return (
                <li key={image.id}>
                  <button
                    type="button"
                    onClick={() => selectImage(image.id)}
                    aria-pressed={isSelected}
                    aria-label="Usar esta imagem de fundo"
                    className={cn(
                      "block aspect-[4/5] w-full overflow-hidden rounded-md border border-border outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      isSelected && "ring-2 ring-primary"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- admin-only route, already sized */}
                    <img src={studioImageUrl(image.id)} alt="" loading="lazy" className="size-full object-cover" />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        <FieldDescription>JPG, PNG ou WebP. A imagem é ajustada ao tamanho do slide.</FieldDescription>
      )}

      {backgroundImage ? (
        <>
          <Field>
            <div className="flex items-center justify-between gap-2">
              <FieldLabel>Opacidade</FieldLabel>
              <span className="text-xs text-muted-foreground tabular-nums">{backgroundImage.opacity}%</span>
            </div>
            <Slider
              aria-label="Opacidade da imagem de fundo"
              min={0}
              max={100}
              step={5}
              value={[backgroundImage.opacity]}
              onValueChange={(value) => updateSettings({ opacity: readSliderValue(value) })}
            />
          </Field>

          <Field>
            <div className="flex items-center justify-between gap-2">
              <FieldLabel>Desfoque</FieldLabel>
              <span className="text-xs text-muted-foreground tabular-nums">{backgroundImage.blur}px</span>
            </div>
            <Slider
              aria-label="Desfoque da imagem de fundo"
              min={0}
              max={MAX_BACKGROUND_IMAGE_BLUR}
              step={1}
              value={[backgroundImage.blur]}
              onValueChange={(value) => updateSettings({ blur: readSliderValue(value) })}
            />
          </Field>

          <Field>
            <FieldLabel>Filtro</FieldLabel>
            <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Filtro da imagem de fundo">
              {BACKGROUND_IMAGE_FILTERS.map((filter: BackgroundImageFilter) => {
                const isSelected = backgroundImage.filter === filter
                return (
                  <button
                    key={filter}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => updateSettings({ filter })}
                    className={cn(
                      "flex flex-col gap-1 rounded-md border border-border p-1 text-left text-xs outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
                      isSelected && "border-primary bg-primary/10"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- filter swatch of the admin's own image */}
                    <img
                      src={studioImageUrl(backgroundImage.imageId)}
                      alt=""
                      className="aspect-square w-full rounded-sm object-cover"
                      style={{ filter: BACKGROUND_IMAGE_FILTER_CSS[filter] || undefined }}
                    />
                    <span className="truncate px-0.5">{BACKGROUND_IMAGE_FILTER_LABELS[filter]}</span>
                  </button>
                )
              })}
            </div>
          </Field>

          <Field>
            <FieldLabel>Enquadramento</FieldLabel>
            <ToggleGroup
              variant="outline"
              size="sm"
              value={[backgroundImage.position]}
              onValueChange={(values) => {
                const nextPosition = BACKGROUND_IMAGE_POSITIONS.find((position) => position === values[0])
                if (nextPosition) updateSettings({ position: nextPosition })
              }}
              aria-label="Enquadramento da imagem de fundo"
            >
              {BACKGROUND_IMAGE_POSITIONS.map((position: BackgroundImagePosition) => (
                <ToggleGroupItem key={position} value={position}>
                  {BACKGROUND_IMAGE_POSITION_LABELS[position]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>

          <Button variant="outline" size="sm" className="w-fit" onClick={onApplyToAllSlides}>
            <CopyCheckIcon data-icon="inline-start" />
            Usar este fundo em todos os slides
          </Button>
        </>
      ) : null}
    </FieldSet>
  )
}

