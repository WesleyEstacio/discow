"use client"

import { useRef } from "react"
import { Share2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/toast"
import {
  REVIEW_SHARE_FORMATS,
  REVIEW_SHARE_FORMAT_NAMES,
  buildReviewShareImageUrl,
  type ReviewShareFormat,
} from "@/lib/share-image/review-share-formats"

type ShareReviewButtonProps = {
  username: string
  spotifyId: string
  albumName: string
  reviewVersion: string
}

function toFileNameSlug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
}

function isTouchDeviceWithShareSheet(shareData: ShareData): boolean {
  return (
    typeof navigator.canShare === "function" &&
    navigator.canShare(shareData) &&
    window.matchMedia("(pointer: coarse)").matches
  )
}

function downloadFile(file: File) {
  const objectUrl = URL.createObjectURL(file)
  const downloadLink = document.createElement("a")
  downloadLink.href = objectUrl
  downloadLink.download = file.name
  downloadLink.click()
  URL.revokeObjectURL(objectUrl)
}

export function ShareReviewButton({
  username,
  spotifyId,
  albumName,
  reviewVersion,
}: ShareReviewButtonProps) {
  const imageBlobRequestsByUrl = useRef(new Map<string, Promise<Blob>>())

  function buildImageUrl(format: ReviewShareFormat) {
    return buildReviewShareImageUrl({ username, spotifyId, format, version: reviewVersion })
  }

  function requestImageBlob(imageUrl: string): Promise<Blob> {
    const existingRequest = imageBlobRequestsByUrl.current.get(imageUrl)
    if (existingRequest) return existingRequest

    const imageBlobRequest = fetch(imageUrl).then((response) => {
      if (!response.ok) throw new Error(`Share image failed with ${response.status}`)
      return response.blob()
    })
    imageBlobRequest.catch(() => imageBlobRequestsByUrl.current.delete(imageUrl))
    imageBlobRequestsByUrl.current.set(imageUrl, imageBlobRequest)
    return imageBlobRequest
  }

  function prefetchImagesWhenMenuOpens(isOpen: boolean) {
    if (!isOpen) return
    for (const format of REVIEW_SHARE_FORMAT_NAMES) {
      requestImageBlob(buildImageUrl(format)).catch(() => {})
    }
  }

  async function shareOrDownloadImage(format: ReviewShareFormat) {
    const fileName = `discows-${toFileNameSlug(albumName) || "review"}-${format}.png`

    try {
      const imageBlob = await requestImageBlob(buildImageUrl(format))
      const imageFile = new File([imageBlob], fileName, { type: "image/png" })
      const shareData: ShareData = { files: [imageFile], title: albumName }

      if (isTouchDeviceWithShareSheet(shareData)) {
        await navigator.share(shareData)
        return
      }

      downloadFile(imageFile)
      toast.add({
        title: "Image downloaded",
        description: "Send it to your phone and post it on Instagram.",
        type: "success",
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return

      toast.add({
        title: "Could not create the image",
        description: "Please try again in a moment.",
        type: "error",
      })
    }
  }

  return (
    <DropdownMenu onOpenChange={prefetchImagesWhenMenuOpens}>
      <DropdownMenuTrigger
        render={<Button type="button" variant="outline" />}
        aria-label="Share review on Instagram"
      >
        <Share2Icon data-icon="inline-start" />
        Share
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Share on Instagram</DropdownMenuLabel>
        {REVIEW_SHARE_FORMAT_NAMES.map((format) => (
          <DropdownMenuItem key={format} onClick={() => shareOrDownloadImage(format)}>
            {REVIEW_SHARE_FORMATS[format].label}
            <span className="ml-auto text-xs text-muted-foreground">
              {REVIEW_SHARE_FORMATS[format].aspectRatioLabel}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
