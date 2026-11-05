"use client"

import { useOptimistic, useTransition } from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { toast } from "@/components/ui/toast"
import {
  buildHighlightTypography,
  HIGHLIGHT_FONT_KEYS,
  HIGHLIGHT_FONTS,
  isHighlightFontKey,
  type HighlightFontKey,
} from "@/lib/studio/highlight-fonts"
import { saveHighlightFontAction } from "@/lib/studio/settings-actions"

type HighlightFontPickerProps = {
  savedFontKey: HighlightFontKey
  sampleWord: string
}

export function HighlightFontPicker({ savedFontKey, sampleWord }: HighlightFontPickerProps) {
  const [selectedFontKey, setOptimisticFontKey] = useOptimistic(savedFontKey)
  const [isSaving, startSaving] = useTransition()

  function selectFont(fontKey: HighlightFontKey) {
    startSaving(async () => {
      setOptimisticFontKey(fontKey)
      try {
        await saveHighlightFontAction(fontKey)
        toast.add({ title: `Fonte de destaque: ${HIGHLIGHT_FONTS[fontKey].label}`, type: "success" })
      } catch {
        toast.add({ title: "Não foi possível salvar a fonte", type: "error" })
      }
    })
  }

  return (
    <ToggleGroup
      variant="outline"
      value={[selectedFontKey]}
      onValueChange={(values) => {
        const nextFontKey = values[0]
        if (nextFontKey && isHighlightFontKey(nextFontKey) && nextFontKey !== selectedFontKey) selectFont(nextFontKey)
      }}
      aria-label="Fonte de destaque"
      aria-busy={isSaving}
      className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3"
    >
      {HIGHLIGHT_FONT_KEYS.map((fontKey) => {
        const font = HIGHLIGHT_FONTS[fontKey]
        return (
          <ToggleGroupItem
            key={fontKey}
            value={fontKey}
            aria-label={`${font.label} (${font.description})`}
            className="h-auto flex-col items-start gap-1 px-4 py-3 text-left"
          >
            <span className="text-3xl leading-tight" style={buildHighlightTypography(fontKey, "preview")}>
              {sampleWord}
            </span>
            <span className="text-xs text-muted-foreground">
              {font.label} · {font.description}
            </span>
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
