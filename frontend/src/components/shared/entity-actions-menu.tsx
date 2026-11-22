import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type EntityActionsMenuProps = {
  /** Names the row for assistive technology, e.g. "Lab B103". */
  entityName: string
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function EntityActionsMenu({
  entityName,
  onView,
  onEdit,
  onDelete,
}: EntityActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="icon-sm"
          className="border-border"
          aria-label={`Actions for ${entityName}`}
        >
          <MoreHorizontal className="size-[18px]" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[232px]">
        {onView ? (
          <DropdownMenuItem onSelect={onView}>
            <Eye aria-hidden="true" />
            View details
          </DropdownMenuItem>
        ) : null}
        {onEdit ? (
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil aria-hidden="true" />
            Edit
          </DropdownMenuItem>
        ) : null}
        {onDelete ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onDelete}>
              <Trash2 aria-hidden="true" />
              Delete
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
