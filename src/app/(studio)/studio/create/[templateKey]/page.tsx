import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"
import { CreatePostForm } from "@/components/studio/create-post-form"
import { StudioPageHeader } from "@/components/studio/studio-page-header"
import { Button } from "@/components/ui/button"
import { requireStudioAdmin } from "@/lib/studio/admin"
import { listStudioAlbums } from "@/lib/studio/albums"
import { createPostFromTemplateAction } from "@/lib/studio/post-actions"
import { findStudioTemplate } from "@/lib/studio/templates"

type CreateFromTemplatePageProps = {
  params: Promise<{ templateKey: string }>
}

export default async function CreateFromTemplatePage({ params }: CreateFromTemplatePageProps) {
  await requireStudioAdmin()
  const { templateKey } = await params
  const template = findStudioTemplate(templateKey)
  if (!template) notFound()

  const albums = await listStudioAlbums({}, 400)
  const templateForClient = {
    key: template.key,
    albumSlots: template.albumSlots,
    settingFields: template.settingFields,
  }

  return (
    <>
      <StudioPageHeader
        eyebrow="Criar publicação · Etapas 2 e 3"
        title={template.name}
        description={template.objective}
        actions={
          <Button variant="ghost" render={<Link href="/studio/create" />} nativeButton={false}>
            <ArrowLeftIcon data-icon="inline-start" />
            Trocar formato
          </Button>
        }
      />
      <div className="px-6 py-8 md:px-10">
        <CreatePostForm
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
          action={createPostFromTemplateAction.bind(null, template.key)}
        />
      </div>
    </>
  )
}
