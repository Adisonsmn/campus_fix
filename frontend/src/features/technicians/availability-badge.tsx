import { CircleCheck, CircleOff, type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { AvailabilityStatus } from '@/features/technicians/types'

const STYLES: Record<AvailabilityStatus, { icon: LucideIcon; className: string }> = {
  Available: { icon: CircleCheck, className: 'bg-ice text-navy' },
  Unavailable: { icon: CircleOff, className: 'border-[1.5px] border-navy bg-white text-navy' },
}

/** Icon plus text, never color alone. */
export function AvailabilityBadge({ status }: { status: AvailabilityStatus }) {
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
