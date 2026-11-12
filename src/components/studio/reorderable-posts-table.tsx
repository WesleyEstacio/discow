"use client"

import { useOptimistic, useState, useTransition, type DragEvent } from "react"
import Link from "next/link"
import { ArrowDownIcon, ArrowUpIcon, CheckIcon, ChevronDownIcon, GripVerticalIcon } from "lucide-react"
import { PostRowActions } from "@/components/studio/post-row-actions"
import { PostStatusBadge } from "@/components/studio/post-status-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { reorderPostsAction, updatePostStatusAction, type PostListActionResult } from "@/lib/studio/post-actions"
import { POST_STATUS_LABELS, POST_STATUSES, type PostStatus } from "@/lib/studio/post-status"
import { cn } from "@/lib/utils"

export type PostListRow = {
  id: string
  title: string
  slideCount: number
  templateName: string
  status: PostStatus
  languageLabel: string
  scheduledLabel: string
  updatedLabel: string
}

type OptimisticPostChange =
  | { kind: "reorder"; orderedPostIds: string[] }
  | { kind: "status"; postId: string; status: PostStatus }

function applyPostChange(rows: PostListRow[], change: OptimisticPostChange): PostListRow[] {
  if (change.kind === "status") {
    return rows.map((row) => (row.id === change.postId ? { ...row, status: change.status } : row))
  }
  const rowsById = new Map(rows.map((row) => [row.id, row]))
  return change.orderedPostIds.flatMap((postId) => {
    const row = rowsById.get(postId)
    return row ? [row] : []
  })
}

function moveItem<Item>(items: Item[], fromIndex: number, toIndex: number): Item[] {
  const reorderedItems = [...items]
  const [movedItem] = reorderedItems.splice(fromIndex, 1)
  if (movedItem !== undefined) reorderedItems.splice(toIndex, 0, movedItem)
  return reorderedItems
}

export function ReorderablePostsTable({ rows }: { rows: PostListRow[] }) {
  const [visibleRows, applyOptimisticChange] = useOptimistic(rows, applyPostChange)
  const [, startSaving] = useTransition()
  const [draggedPostId, setDraggedPostId] = useState<string | null>(null)
  const [dropTargetPostId, setDropTargetPostId] = useState<string | null>(null)

  function runOptimisticChange(change: OptimisticPostChange, saveChange: () => Promise<PostListActionResult>) {
    startSaving(async () => {
      applyOptimisticChange(change)
      const result = await saveChange()
      if (!result.success) toast.add({ title: "Não foi possível salvar", description: result.error, type: "error" })
    })
  }

  function movePost(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= visibleRows.length) return
    const orderedPostIds = moveItem(visibleRows, fromIndex, toIndex).map((row) => row.id)
    runOptimisticChange({ kind: "reorder", orderedPostIds }, () => reorderPostsAction(orderedPostIds))
  }

  function changeStatus(postId: string, status: PostStatus) {
    runOptimisticChange({ kind: "status", postId, status }, () => updatePostStatusAction(postId, status))
  }

  function finishDragging() {
    setDraggedPostId(null)
    setDropTargetPostId(null)
  }

  function dropOnRow(event: DragEvent<HTMLTableRowElement>, targetIndex: number) {
    event.preventDefault()
    const draggedIndex = visibleRows.findIndex((row) => row.id === draggedPostId)
    if (draggedIndex !== -1) movePost(draggedIndex, targetIndex)
    finishDragging()
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24"><span className="sr-only">Ordem</span></TableHead>
            <TableHead>Publicação</TableHead>
            <TableHead>Formato</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Idioma</TableHead>
            <TableHead>Data prevista</TableHead>
            <TableHead>Atualizada</TableHead>
            <TableHead className="w-10"><span className="sr-only">Ações</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleRows.map((row, index) => (
            <TableRow
              key={row.id}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move"
                setDraggedPostId(row.id)
              }}
              onDragOver={(event) => {
                if (!draggedPostId) return
                event.preventDefault()
                setDropTargetPostId(row.id)
              }}
              onDrop={(event) => dropOnRow(event, index)}
              onDragEnd={finishDragging}
              className={cn(
                draggedPostId === row.id && "opacity-50",
                dropTargetPostId === row.id && draggedPostId !== row.id && "bg-muted/60"
              )}
            >
              <TableCell>
                <div className="flex items-center gap-0.5">
                  <GripVerticalIcon aria-hidden className="size-4 cursor-grab text-muted-foreground" />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Subir "${row.title}"`}
                    disabled={index === 0}
                    onClick={() => movePost(index, index - 1)}
                  >
                    <ArrowUpIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Descer "${row.title}"`}
                    disabled={index === visibleRows.length - 1}
                    onClick={() => movePost(index, index + 1)}
                  >
                    <ArrowDownIcon />
                  </Button>
                </div>
              </TableCell>
              <TableCell className="max-w-80">
                <Link
                  href={`/studio/posts/${row.id}`}
                  draggable={false}
                  className="block truncate rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {row.title}
                </Link>
                <span className="text-xs text-muted-foreground">{row.slideCount} slides</span>
              </TableCell>
              <TableCell className="text-muted-foreground">{row.templateName}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button variant="ghost" size="sm" className="-ml-2 gap-1 px-2" />}
                    aria-label={`Status de "${row.title}": ${POST_STATUS_LABELS[row.status]}. Alterar status`}
                  >
                    <PostStatusBadge status={row.status} />
                    <ChevronDownIcon className="text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Mudar status</DropdownMenuLabel>
                    {POST_STATUSES.map((status) => (
                      <DropdownMenuItem
                        key={status}
                        disabled={status === row.status}
                        onClick={() => changeStatus(row.id, status)}
                      >
                        <PostStatusBadge status={status} />
                        {status === row.status ? <CheckIcon className="ml-auto" /> : null}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
              <TableCell className="text-muted-foreground">{row.languageLabel}</TableCell>
              <TableCell className="text-muted-foreground">{row.scheduledLabel}</TableCell>
              <TableCell className="text-muted-foreground">{row.updatedLabel}</TableCell>
              <TableCell><PostRowActions postId={row.id} postTitle={row.title} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
