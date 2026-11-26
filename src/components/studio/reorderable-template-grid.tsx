"use client"

import { useOptimistic, useState, useTransition, type DragEvent, type ReactNode } from "react"
import Link from "next/link"
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, ChevronDownIcon, GripVerticalIcon } from "lucide-react"
import { SlideStructureDetails } from "@/components/studio/slide-structure-details"
import { TemplateTagBadge } from "@/components/studio/template-tag-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/toast"
import {
  reorderTemplatesAction,
  updateTemplateTagAction,
  type TemplatePreferenceActionResult,
} from "@/lib/studio/template-preference-actions"
import { TEMPLATE_TAG_LABELS, TEMPLATE_TAGS, type TemplateTag } from "@/lib/studio/template-tags"
import { cn } from "@/lib/utils"

export type TemplateCard = {
  key: string
  name: string
  tagline: string
  slideStructure: string[]
  preview: ReactNode
  tag: TemplateTag | null
}

type OptimisticTemplateChange =
  | { kind: "reorder"; orderedTemplateKeys: string[] }
  | { kind: "tag"; templateKey: string; tag: TemplateTag | null }

function applyTemplateChange(cards: TemplateCard[], change: OptimisticTemplateChange): TemplateCard[] {
  if (change.kind === "tag") {
    return cards.map((card) => (card.key === change.templateKey ? { ...card, tag: change.tag } : card))
  }
  const cardsByKey = new Map(cards.map((card) => [card.key, card]))
  return change.orderedTemplateKeys.flatMap((templateKey) => {
    const card = cardsByKey.get(templateKey)
    return card ? [card] : []
  })
}

function moveItem<Item>(items: Item[], fromIndex: number, toIndex: number): Item[] {
  const reorderedItems = [...items]
  const [movedItem] = reorderedItems.splice(fromIndex, 1)
  if (movedItem !== undefined) reorderedItems.splice(toIndex, 0, movedItem)
  return reorderedItems
}

export function ReorderableTemplateGrid({ cards }: { cards: TemplateCard[] }) {
  const [visibleCards, applyOptimisticChange] = useOptimistic(cards, applyTemplateChange)
  const [, startSaving] = useTransition()
  const [draggedTemplateKey, setDraggedTemplateKey] = useState<string | null>(null)
  const [dropTargetTemplateKey, setDropTargetTemplateKey] = useState<string | null>(null)

  function runOptimisticChange(change: OptimisticTemplateChange, saveChange: () => Promise<TemplatePreferenceActionResult>) {
    startSaving(async () => {
      applyOptimisticChange(change)
      const result = await saveChange()
      if (!result.success) toast.add({ title: "Não foi possível salvar", description: result.error, type: "error" })
    })
  }

  function moveTemplate(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= visibleCards.length) return
    const orderedTemplateKeys = moveItem(visibleCards, fromIndex, toIndex).map((card) => card.key)
    runOptimisticChange({ kind: "reorder", orderedTemplateKeys }, () => reorderTemplatesAction(orderedTemplateKeys))
  }

  function changeTag(templateKey: string, tag: TemplateTag | null) {
    runOptimisticChange({ kind: "tag", templateKey, tag }, () => updateTemplateTagAction(templateKey, tag))
  }

  function finishDragging() {
    setDraggedTemplateKey(null)
    setDropTargetTemplateKey(null)
  }

  function dropOnCard(event: DragEvent<HTMLLIElement>, targetIndex: number) {
    event.preventDefault()
    const draggedIndex = visibleCards.findIndex((card) => card.key === draggedTemplateKey)
    if (draggedIndex !== -1) moveTemplate(draggedIndex, targetIndex)
    finishDragging()
  }

  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] gap-6">
      {visibleCards.map((card, index) => (
        <li
          key={card.key}
          draggable
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move"
            setDraggedTemplateKey(card.key)
          }}
          onDragOver={(event) => {
            if (!draggedTemplateKey) return
            event.preventDefault()
            setDropTargetTemplateKey(card.key)
          }}
          onDrop={(event) => dropOnCard(event, index)}
          onDragEnd={finishDragging}
          className={cn(
            "group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/25",
            draggedTemplateKey === card.key && "opacity-50",
            dropTargetTemplateKey === card.key && draggedTemplateKey !== card.key && "border-primary/60"
          )}
        >
          <div className="p-3 pb-0">{card.preview}</div>

          <div className="flex flex-1 flex-col gap-4 p-5">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-heading text-xl font-semibold tracking-tight">
                  <Link
                    href={`/studio/create/${card.key}`}
                    draggable={false}
                    className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
                  >
                    {card.name}
                  </Link>
                </h2>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{card.slideStructure.length} slides</span>
              </div>
              <p className="text-sm text-muted-foreground">{card.tagline}</p>
            </div>
            <div className="mt-auto">
              <SlideStructureDetails slideStructure={card.slideStructure} />
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between gap-2 border-t border-border px-3 py-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="sm" className="gap-1 px-1.5" />}
                aria-label={`Tag de "${card.name}": ${card.tag ? TEMPLATE_TAG_LABELS[card.tag] : "sem tag"}. Alterar tag`}
              >
                <TemplateTagBadge tag={card.tag} />
                <ChevronDownIcon className="text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Marcar formato como</DropdownMenuLabel>
                {TEMPLATE_TAGS.map((tag) => (
                  <DropdownMenuItem key={tag} disabled={tag === card.tag} onClick={() => changeTag(card.key, tag)}>
                    <TemplateTagBadge tag={tag} />
                    {tag === card.tag ? <CheckIcon className="ml-auto" /> : null}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled={card.tag === null} onClick={() => changeTag(card.key, null)}>
                  Remover tag
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Mover "${card.name}" para antes`}
                disabled={index === 0}
                onClick={() => moveTemplate(index, index - 1)}
              >
                <ArrowLeftIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Mover "${card.name}" para depois`}
                disabled={index === visibleCards.length - 1}
                onClick={() => moveTemplate(index, index + 1)}
              >
                <ArrowRightIcon />
              </Button>
              <GripVerticalIcon aria-hidden="true" className="ml-1 size-4 cursor-grab text-muted-foreground" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
