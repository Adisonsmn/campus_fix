import { Trash2, TriangleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type ConfirmDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  /** Shown when linked records block the deletion. Disables the confirm button. */
  blockedReason?: string
  pending?: boolean
  confirmLabel?: string
  onConfirm: () => void
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  blockedReason,
  pending = false,
  confirmLabel = 'Delete',
  onConfirm,
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => (pending ? undefined : onOpenChange(next))}>
      <AlertDialogContent>
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-ice">
            <Trash2 className="size-5" aria-hidden="true" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </div>
        </div>
        {blockedReason ? (
          <div className="flex items-start gap-3 rounded-[10px] border-[1.5px] border-navy px-4 py-3">
            <TriangleAlert className="mt-0.5 size-[18px] shrink-0" aria-hidden="true" />
            <p className="text-[13px] leading-[18px] font-semibold">{blockedReason}</p>
          </div>
        ) : null}
        <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
          <AlertDialogCancel asChild>
            <Button variant="secondary" disabled={pending}>
              Cancel
            </Button>
          </AlertDialogCancel>
          <Button onClick={onConfirm} disabled={pending || Boolean(blockedReason)}>
            <Trash2 className="size-4" aria-hidden="true" />
            {pending ? 'Deleting…' : confirmLabel}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
