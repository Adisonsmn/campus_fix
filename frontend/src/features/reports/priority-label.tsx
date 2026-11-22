import { Flag } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Priority } from '@/features/reports/types'

/** Icon plus text, never color alone. High uses a filled flag. */
export function PriorityLabel({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 font-semibold', className)}>
      <Flag className={cn('size-4', priority === 'High' && 'fill-current')} aria-hidden="true" />
      {priority}
    </span>
  )
}
