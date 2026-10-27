"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { studioAlbums } from "@/lib/db/schema"
import { requireStudioAdmin } from "@/lib/studio/admin"
import { externalAlbumPayloadSchema, readStudioAlbumForm } from "@/lib/studio/album-input"
import { findDominantCoverColor } from "@/lib/studio/cover-color"

export type AlbumFormState = {
  errors: Record<string, string[] | undefined>
  message: string | null
}

function parseJsonSafely(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function isSafeStudioReturnPath(path: string): boolean {
  return path.startsWith("/studio") && !path.startsWith("//")
}

function revalidateMusicLibrary() {
  revalidatePath("/studio/music", "layout")
  revalidatePath("/studio")
  revalidatePath("/studio/create", "layout")
}

export async function saveExternalAlbumAction(formData: FormData): Promise<void> {
  await requireStudioAdmin()

  const parsedPayload = externalAlbumPayloadSchema.safeParse(
    parseJsonSafely(String(formData.get("album") ?? ""))
  )
  if (!parsedPayload.success) throw new Error("Dados do álbum inválidos")

  const album = parsedPayload.data
  const dominantColorHex = await findDominantCoverColor(album.coverImageUrl)

  await db
    .insert(studioAlbums)
    .values({
      title: album.title,
      artistNames: album.artistNames,
      releaseYear: album.releaseYear,
      coverImageUrl: album.coverImageUrl,
      coverSource: album.coverSource,
      dominantColorHex,
      genres: album.genres,
      spotifyUrl: album.spotifyUrl,
      externalSource: album.source,
      externalId: album.externalId,
    })
    .onConflictDoNothing({ target: [studioAlbums.externalSource, studioAlbums.externalId] })

  revalidateMusicLibrary()

  const returnTo = String(formData.get("returnTo") ?? "")
  if (returnTo && isSafeStudioReturnPath(returnTo)) redirect(returnTo)
}

export async function createManualAlbumAction(
  _previousState: AlbumFormState,
  formData: FormData
): Promise<AlbumFormState> {
  await requireStudioAdmin()

  const parsedForm = readStudioAlbumForm(formData)
  if (!parsedForm.success) {
    return { errors: parsedForm.error.flatten().fieldErrors, message: "Revise os campos destacados." }
  }

  const values = parsedForm.data
  const [createdAlbum] = await db
    .insert(studioAlbums)
    .values({
      ...values,
      coverSource: values.coverImageUrl ? (values.coverSource ?? "custom") : null,
      dominantColorHex: await findDominantCoverColor(values.coverImageUrl),
      externalSource: "manual",
      externalId: null,
    })
    .returning({ id: studioAlbums.id })

  revalidateMusicLibrary()
  redirect(`/studio/music/${createdAlbum!.id}?saved=1`)
}

export async function updateAlbumAction(
  albumId: string,
  _previousState: AlbumFormState,
  formData: FormData
): Promise<AlbumFormState> {
  await requireStudioAdmin()

  const parsedForm = readStudioAlbumForm(formData)
  if (!parsedForm.success) {
    return { errors: parsedForm.error.flatten().fieldErrors, message: "Revise os campos destacados." }
  }

  const [currentAlbum] = await db
    .select({ coverImageUrl: studioAlbums.coverImageUrl, dominantColorHex: studioAlbums.dominantColorHex })
    .from(studioAlbums)
    .where(eq(studioAlbums.id, albumId))
    .limit(1)
  if (!currentAlbum) return { errors: {}, message: "Este álbum não existe mais." }

  const values = parsedForm.data
  const coverChanged = currentAlbum.coverImageUrl !== values.coverImageUrl

  await db
    .update(studioAlbums)
    .set({
      ...values,
      coverSource: values.coverImageUrl ? (values.coverSource ?? "custom") : null,
      dominantColorHex: coverChanged
        ? await findDominantCoverColor(values.coverImageUrl)
        : currentAlbum.dominantColorHex,
      updatedAt: new Date(),
    })
    .where(eq(studioAlbums.id, albumId))

  revalidateMusicLibrary()
  return { errors: {}, message: "Álbum salvo." }
}

export async function deleteAlbumAction(albumId: string): Promise<void> {
  await requireStudioAdmin()
  await db.delete(studioAlbums).where(eq(studioAlbums.id, albumId))
  revalidateMusicLibrary()
  redirect("/studio/music")
}
