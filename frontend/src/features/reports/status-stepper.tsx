import {
  Check,
  Circle,
  CircleCheck,
  FileText,
  Loader,
  UserCheck,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/format'
import { REPORT_STATUSES, type ReportStatus } from '@/features/reports/types'

const STEP_ICONS: Record<ReportStatus, LucideIcon> = {
  Open: FileText,
  Assigned: UserCheck,
  'In Progress': Loader,
  Resolved: CircleCheck,
}

type StatusStepperProps = {
  status: ReportStatus
  /** Stored dates only. A step with no stored date shows no date. */
  createdAt: string
  assignedAt: string | null
  /** The assignment's repair notes, shown read-only under the current step. */
  repairNotes: string | null
}

/** Current-state stepper. It shows stored data only and never invents events. */
export function StatusStepper({ status, createdAt, assignedAt, repairNotes }: StatusStepperProps) {
  const currentIndex = REPORT_STATUSES.indexOf(status)

  const detail = (step: ReportStatus) => {
    if (step === 'Open') return `Submitted ${formatDate(createdAt)}`
    if (step === 'Assigned' && assignedAt) return `Assigned ${formatDate(assignedAt)}`
    return null
  }

  return (
    <ol aria-label="Maintenance progress" className="flex flex-col">
      {REPORT_STATUSES.map((step, index) => {
        const Icon = STEP_ICONS[step]
        const reached = index <= currentIndex
        const current = index === currentIndex
        const last = index === REPORT_STATUSES.length - 1
        const note = current && step === 'In Progress' ? repairNotes : null
        const resolvedNote = current && step === 'Resolved' ? repairNotes : null

        return (
          <li key={step} className="flex gap-4" aria-current={current ? 'step' : undefined}>
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-full',
                  current
                    ? 'bg-teal text-white'
                    : reached
                      ? 'bg-navy text-white'
                      : 'border-[1.5px] border-border bg-card text-muted-foreground',
                )}
              >
                {reached && !current ? (
                  <Check className="size-[18px]" aria-hidden="true" />
                ) : reached ? (
                  <Icon className="size-[18px]" aria-hidden="true" />
                ) : (
                  <Circle className="size-[18px]" aria-hidden="true" />
                )}
              </span>
              {!last ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    'my-1 w-0.5 flex-1',
                    index < currentIndex ? 'bg-navy' : 'bg-border',
                  )}
                />
              ) : null}
            </div>

            <div className={cn('flex min-w-0 flex-1 flex-col gap-1 pb-6', last && 'pb-0')}>
              <p
                className={cn(
                  'flex items-center gap-2 font-bold',
                  !reached && 'text-muted-foreground',
                )}
              >
                {step}
                {current ? (
                  <span className="rounded-full bg-teal px-2 py-0.5 text-xs font-semibold text-white">
                    Current
                  </span>
                ) : null}
              </p>
              {detail(step) ? (
                <p className="text-[13px] text-muted-foreground">{detail(step)}</p>
              ) : null}
              {note || resolvedNote ? (
                <div className="mt-1 rounded-lg bg-canvas p-3">
                  <p className="text-[13px] font-semibold text-muted-foreground">Repair notes</p>
                  <p className="break-words whitespace-pre-line">{note ?? resolvedNote}</p>
                </div>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
