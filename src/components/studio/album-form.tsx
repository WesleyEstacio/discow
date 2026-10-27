"use client"

import { useActionState } from "react"
import { FormSubmitButton } from "@/components/studio/form-submit-button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { StudioAlbumSource, StudioCoverSource } from "@/lib/db/schema"
import type { AlbumFormState } from "@/lib/studio/album-actions"
import { COVER_SOURCE_LABELS } from "@/lib/studio/labels"

export type AlbumFormDefaults = {
  title: string
  artistNames: string[]
  releaseYear: number | null
  coverImageUrl: string | null
  coverSource: StudioCoverSource | null
  genres: string[]
  tags: string[]
  editorialDescription: string
  editorialNotes: string
  spotifyUrl: string | null
  externalSource: StudioAlbumSource
}

type AlbumFormProps = {
  action: (state: AlbumFormState, formData: FormData) => Promise<AlbumFormState>
  defaults: AlbumFormDefaults | null
  submitLabel: string
}

const INITIAL_ALBUM_FORM_STATE: AlbumFormState = { errors: {}, message: null }

function toFieldErrors(messages: string[] | undefined) {
  return messages?.map((message) => ({ message }))
}

export function AlbumForm({ action, defaults, submitLabel }: AlbumFormProps) {
  const [formState, formAction] = useActionState(action, INITIAL_ALBUM_FORM_STATE)
  const coverSourceIsExternal = defaults?.coverSource === "spotify" || defaults?.coverSource === "cover-art-archive"

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6" noValidate>
      <FieldGroup>
        <Field data-invalid={Boolean(formState.errors.title)}>
          <FieldLabel htmlFor="album-title">Título do álbum</FieldLabel>
          <Input id="album-title" name="title" defaultValue={defaults?.title} required aria-invalid={Boolean(formState.errors.title)} />
          <FieldError errors={toFieldErrors(formState.errors.title)} />
        </Field>

        <Field data-invalid={Boolean(formState.errors.artistNames)}>
          <FieldLabel htmlFor="album-artists">Artistas</FieldLabel>
          <Input id="album-artists" name="artistNames" defaultValue={defaults?.artistNames.join(", ")} required aria-invalid={Boolean(formState.errors.artistNames)} />
          <FieldDescription>Separe vários artistas por vírgula.</FieldDescription>
          <FieldError errors={toFieldErrors(formState.errors.artistNames)} />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field data-invalid={Boolean(formState.errors.releaseYear)}>
            <FieldLabel htmlFor="album-year">Ano de lançamento</FieldLabel>
            <Input id="album-year" name="releaseYear" inputMode="numeric" defaultValue={defaults?.releaseYear ?? ""} aria-invalid={Boolean(formState.errors.releaseYear)} />
            <FieldError errors={toFieldErrors(formState.errors.releaseYear)} />
          </Field>
          <Field data-invalid={Boolean(formState.errors.spotifyUrl)}>
            <FieldLabel htmlFor="album-spotify-url">Link do Spotify</FieldLabel>
            <Input id="album-spotify-url" name="spotifyUrl" type="url" defaultValue={defaults?.spotifyUrl ?? ""} aria-invalid={Boolean(formState.errors.spotifyUrl)} />
            <FieldError errors={toFieldErrors(formState.errors.spotifyUrl)} />
          </Field>
        </div>

        <Field data-invalid={Boolean(formState.errors.coverImageUrl)}>
          <FieldLabel htmlFor="album-cover-url">Link da capa</FieldLabel>
          <Input id="album-cover-url" name="coverImageUrl" type="url" defaultValue={defaults?.coverImageUrl ?? ""} aria-invalid={Boolean(formState.errors.coverImageUrl)} />
          <FieldDescription>
            {coverSourceIsExternal && defaults?.coverSource
              ? `Capa vinda de ${COVER_SOURCE_LABELS[defaults.coverSource]}. Se trocar o link, ela passa a contar como imagem própria — use só imagens que você tem autorização para usar.`
              : "Use só imagens que você tem autorização para usar em publicações da marca."}
          </FieldDescription>
          <FieldError errors={toFieldErrors(formState.errors.coverImageUrl)} />
          {coverSourceIsExternal ? (
            <input type="hidden" name="coverSource" value={defaults?.coverSource ?? ""} />
          ) : null}
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="album-genres">Gêneros</FieldLabel>
            <Input id="album-genres" name="genres" defaultValue={defaults?.genres.join(", ")} />
            <FieldDescription>Separados por vírgula.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="album-tags">Tags e climas</FieldLabel>
            <Input id="album-tags" name="tags" defaultValue={defaults?.tags.join(", ")} placeholder="madrugada, recomeço" />
            <FieldDescription>Usadas para filtrar e montar temas.</FieldDescription>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="album-description">Descrição editorial curta</FieldLabel>
          <Textarea id="album-description" name="editorialDescription" rows={3} defaultValue={defaults?.editorialDescription} />
          <FieldDescription>Texto da Discows sobre o álbum, reaproveitado nos slides.</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="album-notes">Notas pessoais</FieldLabel>
          <Textarea id="album-notes" name="editorialNotes" rows={3} defaultValue={defaults?.editorialNotes} />
          <FieldDescription>Só aparecem aqui no Studio.</FieldDescription>
        </Field>
      </FieldGroup>

      <div className="flex items-center gap-3">
        <FormSubmitButton pendingLabel="Salvando…">{submitLabel}</FormSubmitButton>
        {formState.message ? (
          <p role="status" className="text-sm text-muted-foreground">
            {formState.message}
          </p>
        ) : null}
      </div>
    </form>
  )
}
