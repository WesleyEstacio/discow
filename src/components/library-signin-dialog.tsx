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
  // The library page is now a public discovery hub, so only pop the dialog
  // open automatically when the user was redirected here to sign in for a
  // protected route (see src/proxy.ts) - not on every anonymous visit.
  const [isOpen, setIsOpen] = useState(!isAuthenticated && callbackUrl !== "/library")

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
