import { ChevronDownIcon } from "lucide-react"

export function SlideStructureDetails({ slideStructure }: { slideStructure: string[] }) {
  return (
    <details className="group/structure relative z-10 rounded-lg border border-border bg-background/40">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
        Estrutura do carrossel
        <ChevronDownIcon aria-hidden="true" className="size-4 transition-transform group-open/structure:rotate-180" />
      </summary>
      <ol className="flex flex-col gap-1.5 border-t border-border px-3 py-3 text-sm">
        {slideStructure.map((step, stepIndex) => (
          <li key={step} className="flex gap-3">
            <span className="w-5 shrink-0 font-mono text-xs leading-5 text-muted-foreground tabular-nums">
              {String(stepIndex + 1).padStart(2, "0")}
            </span>
            <span className="text-foreground/85">{step}</span>
          </li>
        ))}
      </ol>
    </details>
  )
}
