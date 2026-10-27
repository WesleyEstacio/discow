"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { CopyIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deletePostAction, duplicatePostAction } from "@/lib/studio/post-actions"

export function PostRowActions({ postId, postTitle }: { postId: string; postTitle: string }) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [isWorking, startWorking] = useTransition()

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />} aria-label={`Ações para ${postTitle}`}>
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLinkItem render={<Link href={`/studio/posts/${postId}`} />} closeOnClick>
            <PencilIcon />
            Abrir no editor
          </DropdownMenuLinkItem>
          <DropdownMenuItem disabled={isWorking} onClick={() => startWorking(() => duplicatePostAction(postId))}>
            <CopyIcon />
            Duplicar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsConfirmingDelete(true)} className="text-destructive">
            <Trash2Icon />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir &ldquo;{postTitle}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              Os slides, a legenda e as notas desta publicação serão apagados. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isWorking}
              onClick={() => startWorking(() => deletePostAction(postId))}
            >
              {isWorking ? "Excluindo…" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
