import { Lock, Pencil, Trash2 } from 'lucide-react'

import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useMediaQuery } from '@/hooks/use-media-query'
import { formatDate, formatReportId } from '@/lib/format'
import { AssignmentStatusBadge } from '@/features/assignments/assignment-status-badge'
import { isAssignmentEditable } from '@/features/assignments/rules'
import type { Assignment } from '@/features/assignments/types'
import { PriorityLabel } from '@/features/reports/priority-label'
import type { Report } from '@/features/reports/types'
import type { Technician } from '@/features/technicians/types'

type AssignmentDetailSheetProps = {
  assignment: Assignment | null
  report: Report | undefined
  technician: Technician | undefined
  onOpenChange: (open: boolean) => void
  onEdit: (assignment: Assignment) => void
  onDelete: (assignment: Assignment) => void
}

export function AssignmentDetailSheet({
  assignment,
  report,
  technician,
  onOpenChange,
  onEdit,
  onDelete,
}: AssignmentDetailSheetProps) {
  const isTabletUp = useMediaQuery('(min-width: 48rem)')

  return (
    <Sheet open={assignment !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side={isTabletUp ? 'right' : 'bottom'}
        className="gap-0"
        closeLabel="Close details"
      >
        {assignment ? (
          <>
            <SheetHeader>
              <SheetTitle>{report?.title ?? formatReportId(assignment.report_id)}</SheetTitle>
              <SheetDescription>
                {formatReportId(assignment.report_id)} · Assignment details
              </SheetDescription>
            </SheetHeader>

            <SheetBody className="flex flex-col gap-6 py-4">
              <dl className="grid grid-cols-[112px_1fr] items-start gap-x-3 gap-y-3">
                <dt className="text-[13px] text-muted-foreground">Assignment</dt>
                <dd className="m-0">
                  <AssignmentStatusBadge status={assignment.status} />
                </dd>
                <dt className="text-[13px] text-muted-foreground">Report status</dt>
                <dd className="m-0">{report ? <StatusBadge status={report.status} /> : '—'}</dd>
                <dt className="text-[13px] text-muted-foreground">Priority</dt>
                <dd className="m-0">
                  {report ? <PriorityLabel priority={report.priority} /> : '—'}
                </dd>
                <dt className="text-[13px] text-muted-foreground">Technician</dt>
                <dd className="m-0 font-semibold break-words">
                  {technician?.name ?? `Technician ${assignment.technician_id}`}
                  {technician ? (
                    <span className="block text-[13px] font-normal text-muted-foreground">
                      {technician.specialization}
                    </span>
                  ) : null}
                </dd>
                <dt className="text-[13px] text-muted-foreground">Assigned</dt>
                <dd className="m-0 font-semibold">{formatDate(assignment.assigned_at)}</dd>
                <dt className="text-[13px] text-muted-foreground">Updated</dt>
                <dd className="m-0 font-semibold">{formatDate(assignment.updated_at)}</dd>
              </dl>

              <TextBlock
                id="assignment-instructions"
                title="Instructions"
                text={assignment.instructions}
                empty="No instructions were given."
              />
              <TextBlock
                id="assignment-notes"
                title="Repair notes"
                text={assignment.repair_notes}
                empty="The technician has not added notes yet."
              />
            </SheetBody>

            <SheetFooter>
              {isAssignmentEditable(assignment) ? (
                <>
                  <Button variant="secondary" onClick={() => onDelete(assignment)}>
                    <Trash2 className="size-4" aria-hidden="true" />
                    Delete
                  </Button>
                  <Button onClick={() => onEdit(assignment)}>
                    <Pencil className="size-4" aria-hidden="true" />
                    Edit
                  </Button>
                </>
              ) : (
                <p className="flex items-start gap-2 text-[13px] text-muted-foreground">
                  <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  Editing and deleting are available only while the work is Assigned.
                </p>
              )}
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function TextBlock({
  id,
  title,
  text,
  empty,
}: {
  id: string
  title: string
  text: string | null
  empty: string
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <h3 id={id} className="text-base font-bold">
        {title}
      </h3>
      {text ? (
        <p className="break-words whitespace-pre-line">{text}</p>
      ) : (
        <p className="text-muted-foreground">{empty}</p>
      )}
    </section>
  )
}
