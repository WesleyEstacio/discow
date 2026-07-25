"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { LoginForm } from "@/components/login-form"

type LibrarySignInDialogProps = {
  isAuthenticated: boolean
  callbackUrl?: string
}

export function LibrarySignInDialog({
  isAuthenticated,
  callbackUrl = "/library",
}: LibrarySignInDialogProps) {
  const [isOpen, setIsOpen] = useState(!isAuthenticated)

  if (isAuthenticated) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-transparent p-0 ring-0 shadow-none sm:max-w-sm">
        <DialogHeader className="sr-only">
          <DialogTitle>Sign in to Discows</DialogTitle>
          <DialogDescription>
            Sign in with Google to catalog albums and write reviews.
          </DialogDescription>
        </DialogHeader>
        <LoginForm callbackUrl={callbackUrl} />
      </DialogContent>
    </Dialog>
  )
}
