import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PostEditor } from "@/components/studio/post-editor"
import { requireStudioAdmin } from "@/lib/studio/admin"
import { getStudioAlbumsByIds, listStudioAlbums } from "@/lib/studio/albums"
import { timestampToScheduledDate } from "@/lib/studio/post-input"
import { getStudioPost } from "@/lib/studio/posts"
import { findTemplateName } from "@/lib/studio/templates"

type PostEditorPageProps = {
  params: Promise<{ postId: string }>
}

export const metadata: Metadata = { title: "Editar publicação" }

export default async function PostEditorPage({ params }: PostEditorPageProps) {
  await requireStudioAdmin()
  const { postId } = await params
  const [post, libraryAlbums] = await Promise.all([getStudioPost(postId), listStudioAlbums({}, 400)])
  if (!post) notFound()

  const libraryAlbumIds = new Set(libraryAlbums.map((album) => album.id))
  const postAlbumsOutsideFirstPage = await getStudioAlbumsByIds(
    post.albumIds.filter((albumId) => !libraryAlbumIds.has(albumId))
  )
  const albums = [...libraryAlbums, ...postAlbumsOutsideFirstPage]

  return (
    <PostEditor
      postId={post.id}
      templateName={findTemplateName(post.templateKey)}
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
    />
  )
}
