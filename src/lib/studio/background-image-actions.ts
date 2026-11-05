"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireStudioAdmin } from "@/lib/studio/admin"
import { setDefaultBackgroundImage } from "@/lib/studio/background-images"

const imageIdSchema = z.uuid()

export async function setDefaultBackgroundImageAction(imageId: string, isDefaultBackground: boolean): Promise<void> {
  await requireStudioAdmin()
  const parsedImageId = imageIdSchema.parse(imageId)
  await setDefaultBackgroundImage(parsedImageId, isDefaultBackground === true)
  revalidatePath("/studio/create", "layout")
}
