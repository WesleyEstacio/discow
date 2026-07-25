"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Button, type buttonVariants } from "@/components/ui/button"
import type { VariantProps } from "class-variance-authority"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { LoginForm } from "@/components/login-form"

type SignInButtonProps = VariantProps<typeof buttonVariants> & {
  className?: string
  callbackUrl?: string
  children?: React.ReactNode
}

export function SignInButton({
  variant = "secondary",
  size = "sm",
  className,
  callbackUrl,
  children = "Sign in",
}: SignInButtonProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setIsOpen(true)}
      >
        {children}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-transparent p-0 ring-0 shadow-none sm:max-w-sm">
          <DialogHeader className="sr-only">
            <DialogTitle>Sign in to Discows</DialogTitle>
            <DialogDescription>
              Sign in with Google to catalog albums and write reviews.
            </DialogDescription>
          </DialogHeader>
          <LoginForm callbackUrl={callbackUrl ?? pathname} />
        </DialogContent>
      </Dialog>
    </>
  )
}
