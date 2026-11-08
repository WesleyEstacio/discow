"use client"

import { useRef, type ComponentProps } from "react"
import { HighlighterIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toggleHighlightAroundSelection } from "@/lib/studio/studio-fonts"

type HighlightableTextareaProps = Omit<ComponentProps<typeof Textarea>, "value" | "onChange"> & {
  value: string
  onValueChange: (value: string) => void
}

// A textarea with a button that marks the selected words (or the word under
// the cursor) with *asterisks*, so they are drawn with the highlight font.
export function HighlightableTextarea({ value, onValueChange, ...textareaProps }: HighlightableTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function toggleHighlightOnSelection() {
    const textarea = textareaRef.current
    if (!textarea) return
    const result = toggleHighlightAroundSelection({
      text: value,
      selectionStart: textarea.selectionStart,
      selectionEnd: textarea.selectionEnd,
    })
    if (result.text === value) return
    onValueChange(result.text)
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(result.selectionStart, result.selectionEnd)
    })
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Textarea ref={textareaRef} value={value} onChange={(event) => onValueChange(event.target.value)} {...textareaProps} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onMouseDown={(event) => event.preventDefault()}
        onClick={toggleHighlightOnSelection}
      >
        <HighlighterIcon data-icon="inline-start" />
        Destacar seleção
      </Button>
    </div>
  )
}
