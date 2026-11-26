import "server-only"
import type { SlideCanvasAlbum } from "@/components/studio/slide-canvas"
import { getStudioAlbumsByIds } from "@/lib/studio/albums"
import type { StudioPostSummary } from "@/lib/studio/posts"
import { studioSlideSchema, type StudioSlide } from "@/lib/studio/slides"

export type PostCover = {
  slide: StudioSlide
  slideCount: number
  albumsById: Record<string, SlideCanvasAlbum>
}

// One album query for every listed post, so a grid of covers never turns
// into one request per card.
export async function loadPostCovers(posts: StudioPostSummary[]): Promise<Map<string, PostCover>> {
  const coverSlidesByPostId = new Map<string, StudioSlide>()
  for (const post of posts) {
    const parsedSlide = studioSlideSchema.safeParse(post.storedCoverSlide)
    if (parsedSlide.success) coverSlidesByPostId.set(post.id, parsedSlide.data)
  }

  const coverAlbumIds = [...new Set([...coverSlidesByPostId.values()].flatMap((slide) => slide.albumIds))]
  const coverAlbums = await getStudioAlbumsByIds(coverAlbumIds)
  const albumsById: Record<string, SlideCanvasAlbum> = Object.fromEntries(coverAlbums.map((album) => [album.id, album]))

  return new Map(
    posts.flatMap((post) => {
      const coverSlide = coverSlidesByPostId.get(post.id)
      return coverSlide ? [[post.id, { slide: coverSlide, slideCount: post.slideCount, albumsById }] as const] : []
    })
  )
}
