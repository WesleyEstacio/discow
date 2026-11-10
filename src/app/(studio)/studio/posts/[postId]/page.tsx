import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PostEditor } from "@/components/studio/post-editor"
import { requireStudioAdmin } from "@/lib/studio/admin"
import { getStudioAlbumsByIds, listStudioAlbums } from "@/lib/studio/albums"
import { listRecentStudioImages } from "@/lib/studio/background-images"
import { timestampToScheduledDate } from "@/lib/studio/post-input"
import { listPostPresetSummaries } from "@/lib/studio/post-presets"
import { getStudioPost } from "@/lib/studio/posts"
import { findTemplateName } from "@/lib/studio/templates"

type PostEditorPageProps = {
  params: Promise<{ postId: string }>
}

export const metadata: Metadata = { title: "Editar publicação" }

export default async function PostEditorPage({ params }: PostEditorPageProps) {
  await requireStudioAdmin()
  const { postId } = await params
  const [post, libraryAlbums, uploadedImages] = await Promise.all([
    getStudioPost(postId),
    listStudioAlbums({}, 400),
    listRecentStudioImages(),
  ])
  if (!post) notFound()

  const libraryAlbumIds = new Set(libraryAlbums.map((album) => album.id))
  const [postAlbumsOutsideFirstPage, postPresets] = await Promise.all([
    getStudioAlbumsByIds(post.albumIds.filter((albumId) => !libraryAlbumIds.has(albumId))),
    listPostPresetSummaries(post.templateKey),
  ])
  const albums = [...libraryAlbums, ...postAlbumsOutsideFirstPage]

  return (
    <PostEditor
      postId={post.id}
      templateKey={post.templateKey}
      templateName={findTemplateName(post.templateKey)}
      postPresets={postPresets}
      initialDraft={{
        title: post.title,
        status: post.status,
        language: post.language,
        slides: post.slides,
        caption: post.caption,
        notes: post.notes,
        scheduledFor: timestampToScheduledDate(post.scheduledFor),
      }}
      albums={albums.map((album) => ({
        id: album.id,
        title: album.title,
        artistNames: album.artistNames,
        releaseYear: album.releaseYear,
        coverImageUrl: album.coverImageUrl,
        editorialDescription: album.editorialDescription,
      }))}
      coverSourcesByAlbumId={Object.fromEntries(albums.map((album) => [album.id, album.coverSource]))}
      initialUploadedImages={uploadedImages}
    />
  )
}
