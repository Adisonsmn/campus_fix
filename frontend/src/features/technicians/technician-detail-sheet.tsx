import { Pencil, Trash2 } from 'lucide-react'

import { ErrorState } from '@/components/shared/error-state'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useMediaQuery } from '@/hooks/use-media-query'
import { formatDate, formatReportId, pluralize } from '@/lib/format'
import { useAssignments } from '@/features/assignments/hooks'
import { useReports } from '@/features/reports/hooks'
import { AvailabilityBadge } from '@/features/technicians/availability-badge'
import type { Technician } from '@/features/technicians/types'

type TechnicianDetailSheetProps = {
  technician: Technician | null
  onOpenChange: (open: boolean) => void
  onEdit: (technician: Technician) => void
  onDelete: (technician: Technician) => void
}

export function TechnicianDetailSheet({
  technician,
  onOpenChange,
  onEdit,
  onDelete,
}: TechnicianDetailSheetProps) {
  const isTabletUp = useMediaQuery('(min-width: 48rem)')

  return (
    <Sheet open={technician !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side={isTabletUp ? 'right' : 'bottom'}
        className="gap-0"
        closeLabel="Close details"
      >
        {technician ? (
          <>
            <SheetHeader>
              <SheetTitle>{technician.name}</SheetTitle>
              <SheetDescription>Technician details and assigned work.</SheetDescription>
            </SheetHeader>

            <SheetBody className="flex flex-col gap-6 py-4">
              <dl className="grid grid-cols-[112px_1fr] items-center gap-x-3 gap-y-2">
                <Detail label="Specialization" value={technician.specialization} />
                <Detail label="Email" value={technician.email} />
                <Detail label="Phone" value={technician.phone} />
                <dt className="text-[13px] text-muted-foreground">Availability</dt>
                <dd className="m-0">
                  <AvailabilityBadge status={technician.availability_status} />
                </dd>
              </dl>
              <AssignedWork technicianId={technician.id} />
            </SheetBody>

            <SheetFooter>
              <Button variant="secondary" onClick={() => onDelete(technician)}>
                <Trash2 className="size-4" aria-hidden="true" />
                Delete
              </Button>
              <Button onClick={() => onEdit(technician)}>
                <Pencil className="size-4" aria-hidden="true" />
                Edit
              </Button>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <>
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="m-0 font-semibold break-words">{value || '—'}</dd>
    </>
  )
}

function AssignedWork({ technicianId }: { technicianId: number }) {
  const assignments = useAssignments({ technician_id: technicianId })
  const reports = useReports()
  const reportTitles = new Map((reports.data ?? []).map((report) => [report.id, report.title]))

  return (
    <section aria-labelledby="assigned-work-heading" className="flex flex-col gap-3">
      <h3 id="assigned-work-heading" className="text-base font-bold">
        Assigned work
        {assignments.data ? (
          <span className="ml-2 text-[13px] font-semibold text-muted-foreground">
            {pluralize(assignments.data.length, 'assignment')}
          </span>
        ) : null}
      </h3>

      {assignments.isPending ? (
        <div className="flex flex-col gap-3" role="status" aria-label="Loading assignments">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      ) : assignments.isError ? (
        <ErrorState
          compact
          title="Could not load assignments"
          message={assignments.error.message}
          onRetry={() => void assignments.refetch()}
        />
      ) : assignments.data.length === 0 ? (
        <p className="text-muted-foreground">No assignments for this technician yet.</p>
      ) : (
        <ul className="flex flex-col">
          {assignments.data.map((assignment) => (
            <li
              key={assignment.id}
              className="flex flex-col gap-1.5 border-t py-3 first:border-t-0 first:pt-0"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold">
                  {reportTitles.get(assignment.report_id) ?? formatReportId(assignment.report_id)}
                </p>
                <span className="text-[13px] font-semibold whitespace-nowrap">
                  {assignment.status}
                </span>
              </div>
              <p className="text-[13px] text-muted-foreground">
                {formatReportId(assignment.report_id)} · Assigned{' '}
                {formatDate(assignment.assigned_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
