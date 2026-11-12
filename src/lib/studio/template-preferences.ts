import "server-only"
import { db } from "@/lib/db"
import { studioTemplatePreferences } from "@/lib/db/schema"
import type { TemplateTag } from "@/lib/studio/template-tags"
import { STUDIO_TEMPLATES } from "@/lib/studio/templates"
import type { StudioTemplate } from "@/lib/studio/templates/types"

export type OrganizedStudioTemplate = { template: StudioTemplate; tag: TemplateTag | null }

export async function listOrganizedStudioTemplates(): Promise<OrganizedStudioTemplate[]> {
  const preferences = await db
    .select({
      templateKey: studioTemplatePreferences.templateKey,
      listPosition: studioTemplatePreferences.listPosition,
      tag: studioTemplatePreferences.tag,
    })
    .from(studioTemplatePreferences)
  const preferenceByTemplateKey = new Map(preferences.map((preference) => [preference.templateKey, preference]))
  const templatesWithoutPositionGoLast = STUDIO_TEMPLATES.length

  return STUDIO_TEMPLATES.map((template, codeIndex) => {
    const preference = preferenceByTemplateKey.get(template.key)
    return {
      template,
      tag: preference?.tag ?? null,
      sortPosition: preference ? preference.listPosition : templatesWithoutPositionGoLast + codeIndex,
    }
  })
    .sort((first, second) => first.sortPosition - second.sortPosition)
    .map(({ template, tag }) => ({ template, tag }))
}
