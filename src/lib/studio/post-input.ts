import { z } from "zod"
import { POST_LANGUAGES, POST_STATUSES } from "@/lib/studio/post-status"
import { studioSlidesSchema } from "@/lib/studio/slides"

export const MAX_CAPTION_LENGTH = 2200

export const studioPostDraftSchema = z
  .object({
    title: z.string().trim().min(1, "Dê um título à publicação").max(200),
    status: z.enum(POST_STATUSES),
    language: z.enum(POST_LANGUAGES),
    slides: studioSlidesSchema,
    caption: z.string().max(MAX_CAPTION_LENGTH, `A legenda do Instagram aceita até ${MAX_CAPTION_LENGTH} caracteres`),
    notes: z.string().max(4000),
    scheduledFor: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable(),
  })
  .refine((draft) => draft.status !== "scheduled" || draft.scheduledFor !== null, {
    message: "Defina a data de publicação para marcar como agendada",
    path: ["scheduledFor"],
  })

export type StudioPostDraft = z.infer<typeof studioPostDraftSchema>

// Dates are planned in Brazil time and stored at noon so the day never
// shifts when shown in another timezone.
export function scheduledDateToTimestamp(scheduledDate: string | null): Date | null {
  return scheduledDate ? new Date(`${scheduledDate}T12:00:00-03:00`) : null
}

export function timestampToScheduledDate(timestamp: Date | null): string | null {
  if (!timestamp) return null
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(timestamp)
}
