export const POST_STATUSES = [
  "idea",
  "draft",
  "in_review",
  "approved",
  "scheduled",
  "published",
] as const

export type PostStatus = (typeof POST_STATUSES)[number]

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  idea: "Ideia",
  draft: "Rascunho",
  in_review: "Em revisão",
  approved: "Aprovada",
  scheduled: "Agendada",
  published: "Publicada",
}

export const POST_LANGUAGES = ["pt", "en"] as const
export type PostLanguage = (typeof POST_LANGUAGES)[number]

export const POST_LANGUAGE_LABELS: Record<PostLanguage, string> = {
  pt: "Português",
  en: "English",
}

export function isPostStatus(value: string | undefined): value is PostStatus {
  return POST_STATUSES.some((status) => status === value)
}

export function isPostLanguage(value: string | undefined): value is PostLanguage {
  return POST_LANGUAGES.some((language) => language === value)
}
