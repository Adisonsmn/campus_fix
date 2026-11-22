import { CircleCheck, Loader, UserCheck, type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { AssignmentStatus } from '@/features/assignments/types'

const STYLES: Record<AssignmentStatus, { icon: LucideIcon; className: string }> = {
  Assigned: { icon: UserCheck, className: 'bg-ice text-navy' },
  'In Progress': { icon: Loader, className: 'bg-teal text-white' },
  Completed: { icon: CircleCheck, className: 'bg-navy text-white' },
}

/** Mirrors the report StatusBadge: always an icon plus text. */
export function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  const { icon: Icon, className } = STYLES[status]
  return (
    <span
      className={cn(
        'inline-flex h-[26px] items-center gap-1.5 rounded-full px-2.5 text-[13px] font-semibold whitespace-nowrap',
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {status}
    </span>
  )
}
