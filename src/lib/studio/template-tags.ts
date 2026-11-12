export const TEMPLATE_TAGS = ["ready", "in_development", "in_review", "postponed", "idea"] as const

export type TemplateTag = (typeof TEMPLATE_TAGS)[number]

export const TEMPLATE_TAG_LABELS: Record<TemplateTag, string> = {
  ready: "Pronto",
  in_development: "Em desenvolvimento",
  in_review: "Em revisão",
  postponed: "Adiado",
  idea: "Ideia",
}

export function isTemplateTag(value: unknown): value is TemplateTag {
  return TEMPLATE_TAGS.some((tag) => tag === value)
}
