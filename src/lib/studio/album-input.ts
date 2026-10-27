import { z } from "zod"

const COVER_SOURCES = ["spotify", "cover-art-archive", "custom"] as const

function splitCommaSeparatedList(value: string): string[] {
  return [
    ...new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    ),
  ]
}

const commaSeparatedListSchema = z
  .string()
  .max(500)
  .transform(splitCommaSeparatedList)

const optionalHttpsUrlSchema = z
  .string()
  .trim()
  .max(1000)
  .refine((value) => value === "" || value.startsWith("https://"), {
    message: "Use um link https://",
  })
  .transform((value) => value || null)

export const studioAlbumFormSchema = z.object({
  title: z.string().trim().min(1, "Informe o título do álbum").max(200),
  artistNames: commaSeparatedListSchema.refine((names) => names.length > 0, {
    message: "Informe pelo menos um artista",
  }),
  releaseYear: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d{4}$/.test(value), {
      message: "Use um ano com 4 dígitos",
    })
    .transform((value) => (value ? Number.parseInt(value, 10) : null)),
  coverImageUrl: optionalHttpsUrlSchema,
  coverSource: z.enum(COVER_SOURCES).nullable(),
  genres: commaSeparatedListSchema,
  tags: commaSeparatedListSchema,
  editorialDescription: z.string().trim().max(600),
  editorialNotes: z.string().trim().max(2000),
  spotifyUrl: optionalHttpsUrlSchema,
})

export type StudioAlbumFormValues = z.infer<typeof studioAlbumFormSchema>

export const externalAlbumPayloadSchema = z.object({
  source: z.enum(["spotify", "musicbrainz"]),
  externalId: z.string().min(1).max(100),
  title: z.string().min(1).max(300),
  artistNames: z.array(z.string().max(200)).max(20),
  releaseYear: z.number().int().nullable(),
  coverImageUrl: z.string().startsWith("https://").max(1000).nullable(),
  coverSource: z.enum(COVER_SOURCES).nullable(),
  spotifyUrl: z.string().startsWith("https://").max(1000).nullable(),
  genres: z.array(z.string().max(100)).max(20),
})

export function readStudioAlbumForm(formData: FormData) {
  const coverSource = formData.get("coverSource")
  return studioAlbumFormSchema.safeParse({
    title: formData.get("title") ?? "",
    artistNames: formData.get("artistNames") ?? "",
    releaseYear: formData.get("releaseYear") ?? "",
    coverImageUrl: formData.get("coverImageUrl") ?? "",
    coverSource: coverSource ? coverSource : null,
    genres: formData.get("genres") ?? "",
    tags: formData.get("tags") ?? "",
    editorialDescription: formData.get("editorialDescription") ?? "",
    editorialNotes: formData.get("editorialNotes") ?? "",
    spotifyUrl: formData.get("spotifyUrl") ?? "",
  })
}
