import Link from "next/link"
import { CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const CREATION_STEPS = ["Formato", "Álbuns", "Textos e visual"] as const

// The format is chosen on its own page; albums and texts share the next one.
export function CreationSteps({ isChoosingFormat }: { isChoosingFormat: boolean }) {
  return (
    <nav aria-label="Etapas da criação">
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        {CREATION_STEPS.map((stepLabel, stepIndex) => {
          const isFormatStep = stepIndex === 0
          const isDone = isFormatStep && !isChoosingFormat
          const isCurrent = isFormatStep ? isChoosingFormat : !isChoosingFormat
          const stepBadge = (
            <span
              aria-hidden="true"
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                isDone && "bg-primary/15 text-primary",
                isCurrent && "bg-primary text-primary-foreground",
                !isDone && !isCurrent && "bg-muted text-muted-foreground"
              )}
            >
              {isDone ? <CheckIcon className="size-3.5" /> : stepIndex + 1}
            </span>
          )
          return (
            <li key={stepLabel} className="flex items-center gap-3">
              {stepIndex > 0 ? <span aria-hidden="true" className="h-px w-6 bg-border" /> : null}
              {isDone ? (
                <Link
                  href="/studio/create"
                  className="flex items-center gap-2 rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {stepBadge}
                  {stepLabel}
                  <span className="sr-only">(concluída, trocar formato)</span>
                </Link>
              ) : (
                <span
                  className={cn("flex items-center gap-2", isCurrent ? "font-medium text-foreground" : "text-muted-foreground")}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {stepBadge}
                  {stepLabel}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
