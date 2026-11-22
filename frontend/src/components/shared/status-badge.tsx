import { Circle, CircleCheck, Loader, UserCheck, type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { ReportStatus } from '@/features/reports/types'

const STATUS_STYLES: Record<ReportStatus, { icon: LucideIcon; className: string }> = {
  Open: { icon: Circle, className: 'border-[1.5px] border-navy bg-white text-navy' },
  Assigned: { icon: UserCheck, className: 'bg-ice text-navy' },
  'In Progress': { icon: Loader, className: 'bg-teal text-white' },
  Resolved: { icon: CircleCheck, className: 'bg-navy text-white' },
}

/** The one report status component: always an icon plus text, never color alone. */
export function StatusBadge({ status, className }: { status: ReportStatus; className?: string }) {
  const { icon: Icon, className: styles } = STATUS_STYLES[status]
  return (
    <span
      className={cn(
        'inline-flex h-[26px] items-center gap-1.5 rounded-full px-2.5 text-[13px] font-semibold whitespace-nowrap',
        styles,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {status}
    </span>
  )
}
