"use client"

import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"

type FormSubmitButtonProps = React.ComponentProps<typeof Button> & {
  pendingLabel: string
}

export function FormSubmitButton({ pendingLabel, children, disabled, ...buttonProps }: FormSubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending || disabled} aria-busy={pending} {...buttonProps}>
      {pending ? pendingLabel : children}
    </Button>
  )
}
