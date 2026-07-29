"use client"

import { useRef, useState, useTransition } from "react"
import { PencilIcon, Trash2Icon, UploadIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import {
  removeAvatarAction,
  updateProfileAction,
  uploadAvatarAction,
} from "@/lib/profile-actions"

export type ProfileEditDialogProps = {
  name: string | null
  username: string | null
  image: string | null
  onUpdated: (patch: {
    name?: string
    username?: string
    image?: string | null
  }) => void
  // Lets call sites fit the trigger button into different layouts (e.g. full
  // width in the profile sidebar) without hardcoding that here.
  triggerClassName?: string
}

export function ProfileEditDialog({
  name,
  username,
  image,
  onUpdated,
  triggerClassName,
}: ProfileEditDialogProps) {
  const [open, setOpen] = useState(false)
  const [nameInput, setNameInput] = useState(name ?? "")
  const [usernameInput, setUsernameInput] = useState(username ?? "")
  const [currentImage, setCurrentImage] = useState(image)
  const [isSaving, startSaving] = useTransition()
  const [isUploadingPhoto, startUploadingPhoto] = useTransition()
  const [isRemovingPhoto, startRemovingPhoto] = useTransition()
  const photoInputRef = useRef<HTMLInputElement>(null)

  const displayName = nameInput || username || "Discows listener"
  const initials = displayName.slice(0, 2).toUpperCase()
  const isBusy = isSaving || isUploadingPhoto || isRemovingPhoto

  function handleOpenChange(nextOpen: boolean) {
    if (isBusy) return
    setOpen(nextOpen)
    if (nextOpen) {
      // Reset the form to the latest saved values every time it's reopened.
      setNameInput(name ?? "")
      setUsernameInput(username ?? "")
      setCurrentImage(image)
    }
  }

  function handlePickPhoto() {
    photoInputRef.current?.click()
  }

  function handlePhotoFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    startUploadingPhoto(async () => {
      const result = await uploadAvatarAction(file)
      if (!result.success) {
        toast.add({
          title: "Could not upload photo",
          description: result.error,
          type: "error",
        })
        return
      }
      setCurrentImage(result.image ?? null)
      onUpdated({ image: result.image ?? null })
      toast.add({ title: "Photo updated", type: "success" })
    })
  }

  function handleRemovePhoto() {
    startRemovingPhoto(async () => {
      const result = await removeAvatarAction()
      if (!result.success) {
        toast.add({
          title: "Could not remove photo",
          description: result.error,
          type: "error",
        })
        return
      }
      setCurrentImage(null)
      onUpdated({ image: null })
      toast.add({ title: "Photo removed", type: "success" })
    })
  }

  function handleSave() {
    const trimmedName = nameInput.trim()
    const trimmedUsername = usernameInput.trim()

    if (!trimmedName) {
      toast.add({
        title: "Name can't be empty",
        type: "error",
      })
      return
    }
    if (!trimmedUsername) {
      toast.add({
        title: "Username can't be empty",
        type: "error",
      })
      return
    }

    startSaving(async () => {
      const result = await updateProfileAction({
        name: trimmedName,
        username: trimmedUsername,
      })

      if (!result.success) {
        toast.add({
          title: "Could not save profile",
          description: result.error,
          type: "error",
        })
        return
      }

      onUpdated({ name: trimmedName, username: trimmedUsername.toLowerCase() })
      toast.add({ title: "Profile updated", type: "success" })
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* Rendered twice - icon-only on mobile, icon+label from `sm` up - same
          pattern as the header nav links, since the shared Button component
          only balances its padding when the label is actually visible. */}
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Edit profile"
            className={cn("sm:hidden", triggerClassName)}
          />
        }
      >
        <PencilIcon />
      </DialogTrigger>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn("hidden sm:inline-flex", triggerClassName)}
          />
        }
      >
        <PencilIcon data-icon="inline-start" />
        Edit profile
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Update how you show up on Discows.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field orientation="horizontal" className="items-center">
            {/* No `size` prop - Avatar's data-[size=lg]:size-10 rule outranks
                a plain size-* override in CSS specificity, so it would cap
                this at 40px otherwise. */}
            <Avatar className="size-16">
              {currentImage ? (
                <AvatarImage src={currentImage} alt={displayName} />
              ) : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePickPhoto}
                disabled={isBusy}
              >
                <UploadIcon data-icon="inline-start" />
                {isUploadingPhoto ? "Uploading…" : "Upload photo"}
              </Button>
              {currentImage ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePhoto}
                  disabled={isBusy}
                >
                  <Trash2Icon data-icon="inline-start" />
                  {isRemovingPhoto ? "Removing…" : "Remove"}
                </Button>
              ) : null}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handlePhotoFileChange}
              />
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="profile-name">Name</FieldLabel>
            <Input
              id="profile-name"
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              maxLength={80}
              disabled={isBusy}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="profile-username">Username</FieldLabel>
            <Input
              id="profile-username"
              value={usernameInput}
              onChange={(event) => setUsernameInput(event.target.value)}
              maxLength={30}
              disabled={isBusy}
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isBusy}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isBusy}>
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
