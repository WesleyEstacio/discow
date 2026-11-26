import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"
import { CreatePostForm } from "@/components/studio/create-post-form"
import { CreationSteps } from "@/components/studio/creation-steps"
import { TemplateDeckPreview } from "@/components/studio/template-deck-preview"
import { StudioPageHeader } from "@/components/studio/studio-page-header"
import { Button } from "@/components/ui/button"
import { requireStudioAdmin } from "@/lib/studio/admin"
import { listStudioAlbums } from "@/lib/studio/albums"
import { listDefaultBackgroundImages } from "@/lib/studio/background-images"
import { createPostFromTemplateAction } from "@/lib/studio/post-actions"
import { listPostPresetSummaries } from "@/lib/studio/post-presets"
import { buildTemplatePreview } from "@/lib/studio/template-previews"
import { findStudioTemplate } from "@/lib/studio/templates"

type CreateFromTemplatePageProps = {
  params: Promise<{ templateKey: string }>
}

const PREVIEW_SLIDES_IN_SUMMARY = 3

export default async function CreateFromTemplatePage({ params }: CreateFromTemplatePageProps) {
  await requireStudioAdmin()
  const { templateKey } = await params
  const template = findStudioTemplate(templateKey)
  if (!template) notFound()

  const [albums, defaultBackgroundImages, postPresets] = await Promise.all([
    listStudioAlbums({}, 400),
    listDefaultBackgroundImages(),
    listPostPresetSummaries(template.key),
  ])
  const templateForClient = {
    key: template.key,
    slideStructure: template.slideStructure,
    defaultIdentityKey: template.defaultIdentityKey,
    albumSlots: template.albumSlots,
    settingFields: template.settingFields,
  }

  return (
    <>
      <StudioPageHeader
        eyebrow="Criar publicação"
        title={template.name}
        description={template.objective}
        actions={
          <Button variant="ghost" render={<Link href="/studio/create" />} nativeButton={false}>
            <ArrowLeftIcon data-icon="inline-start" />
            Trocar formato
          </Button>
        }
      />
      <div className="flex flex-col gap-8 px-6 py-8 md:px-10">
        <CreationSteps isChoosingFormat={false} />
        <CreatePostForm
          formatPreview={
            <TemplateDeckPreview
              preview={buildTemplatePreview(
                template,
                albums.filter((album) => album.coverImageUrl),
                PREVIEW_SLIDES_IN_SUMMARY
              )}
            />
          }
          template={templateForClient}
          albums={albums.map((album) => ({
            id: album.id,
            title: album.title,
            artistNames: album.artistNames,
            releaseYear: album.releaseYear,
            coverImageUrl: album.coverImageUrl,
            dominantColorHex: album.dominantColorHex,
            genres: album.genres,
            tags: album.tags,
          }))}
          defaultBackgroundImages={defaultBackgroundImages}
          postPresets={postPresets}
          action={createPostFromTemplateAction.bind(null, template.key)}
        />
      </div>
    </>
  )
}
