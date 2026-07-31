"use client"

import { useState, useTransition } from "react"
import { PencilIcon } from "lucide-react"
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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import { updateProfileAction } from "@/lib/profile-actions"
import type { ProfileTag } from "@/lib/tags"

const MAX_BIO_LENGTH = 160

export type ProfileEditDialogProps = {
  name: string | null
  username: string | null
  bio?: string | null
  // Tags the user has actually earned - the tag picker below never offers
  // anything outside this list. See resolveDisplayTag() in src/lib/tags.ts.
  availableTags?: ProfileTag[]
  // The tag currently shown on the profile (already resolved to a default
  // if the user hasn't picked one) - preselects the picker.
  selectedTagId?: string | null
  onUpdated: (patch: {
    name?: string
    username?: string
    bio?: string
    displayTagKey?: string | null
  }) => void
  // Lets call sites fit the trigger button into different layouts (e.g. full
  // width in the profile sidebar) without hardcoding that here.
  triggerClassName?: string
}

export function ProfileEditDialog({
  name,
  username,
  bio,
  availableTags = [],
  selectedTagId = null,
  onUpdated,
  triggerClassName,
}: ProfileEditDialogProps) {
  const [open, setOpen] = useState(false)
  const [nameInput, setNameInput] = useState(name ?? "")
  const [usernameInput, setUsernameInput] = useState(username ?? "")
  const [bioInput, setBioInput] = useState(bio ?? "")
  const [tagInput, setTagInput] = useState(selectedTagId)
  const [isSaving, startSaving] = useTransition()

  function handleOpenChange(nextOpen: boolean) {
    if (isSaving) return
    setOpen(nextOpen)
    if (nextOpen) {
      // Reset the form to the latest saved values every time it's reopened.
      setNameInput(name ?? "")
      setUsernameInput(username ?? "")
      setBioInput(bio ?? "")
      setTagInput(selectedTagId)
    }
  }

  function handleSave() {
    const trimmedName = nameInput.trim()
    const trimmedUsername = usernameInput.trim()
    const trimmedBio = bioInput.trim()

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
    if (trimmedBio.length > MAX_BIO_LENGTH) {
      toast.add({
        title: `Bio must be ${MAX_BIO_LENGTH} characters or fewer`,
        type: "error",
      })
      return
    }

    startSaving(async () => {
      const result = await updateProfileAction({
        name: trimmedName,
        username: trimmedUsername,
        bio: trimmedBio,
        displayTagKey: tagInput,
      })

      if (!result.success) {
        toast.add({
          title: "Could not save profile",
          description: result.error,
          type: "error",
        })
        return
      }

      onUpdated({
        name: trimmedName,
        username: trimmedUsername.toLowerCase(),
        bio: trimmedBio,
        displayTagKey: tagInput,
      })
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
          <Field>
            <FieldLabel htmlFor="profile-name">Name</FieldLabel>
            <Input
              id="profile-name"
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              maxLength={80}
              disabled={isSaving}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="profile-username">Username</FieldLabel>
            <Input
              id="profile-username"
              value={usernameInput}
              onChange={(event) => setUsernameInput(event.target.value)}
              maxLength={30}
              disabled={isSaving}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="profile-bio">Bio</FieldLabel>
            <Textarea
              id="profile-bio"
              value={bioInput}
              onChange={(event) => setBioInput(event.target.value)}
              maxLength={MAX_BIO_LENGTH}
              placeholder="Tell people what you're into."
              disabled={isSaving}
            />
            <FieldDescription>
              {bioInput.length}/{MAX_BIO_LENGTH}
            </FieldDescription>
          </Field>

          {availableTags.length > 0 ? (
            <Field>
              <FieldLabel htmlFor="profile-tag">Tag</FieldLabel>
              <Select
                value={tagInput}
                onValueChange={(value) => setTagInput(value)}
                disabled={isSaving}
              >
                <SelectTrigger id="profile-tag" className="w-full">
                  <SelectValue placeholder="Choose a tag">
                    {(value: string | null) =>
                      availableTags.find((tag) => tag.id === value)?.label ?? "Choose a tag"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {availableTags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      {tag.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                Shown next to your name. Defaults to when you joined.
              </FieldDescription>
            </Field>
          ) : null}
        </FieldGroup>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
