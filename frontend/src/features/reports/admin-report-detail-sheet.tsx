import { Lock, Pencil, Trash2, UserPlus } from 'lucide-react'

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
import { Skeleton } from '@/components/ui/skeleton'
import { useMediaQuery } from '@/hooks/use-media-query'
import { formatDate, formatReportId } from '@/lib/format'
import { useAssignments } from '@/features/assignments/hooks'
import type { Facility } from '@/features/facilities/types'
import { PriorityLabel } from '@/features/reports/priority-label'
import { isReportEditable } from '@/features/reports/rules'
import { facilityLocation } from '@/features/reports/schema'
import type { Report } from '@/features/reports/types'
import { useTechnicians } from '@/features/technicians/hooks'

type AdminReportDetailSheetProps = {
  report: Report | null
  facility: Facility | undefined
  onOpenChange: (open: boolean) => void
  onAssign: (report: Report) => void
  onEdit: (report: Report) => void
  onDelete: (report: Report) => void
}

export function AdminReportDetailSheet({
  report,
  facility,
  onOpenChange,
  onAssign,
  onEdit,
  onDelete,
}: AdminReportDetailSheetProps) {
  const isTabletUp = useMediaQuery('(min-width: 48rem)')

  return (
    <Sheet open={report !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side={isTabletUp ? 'right' : 'bottom'}
        className="gap-0"
        closeLabel="Close details"
      >
        {report ? (
          <>
            <SheetHeader>
              <SheetTitle>{report.title}</SheetTitle>
              <SheetDescription>{formatReportId(report.id)} · Report details</SheetDescription>
            </SheetHeader>

            <SheetBody className="flex flex-col gap-6 py-4">
              <dl className="grid grid-cols-[96px_1fr] items-start gap-x-3 gap-y-3">
                <dt className="text-[13px] text-muted-foreground">Status</dt>
                <dd className="m-0">
                  <StatusBadge status={report.status} />
                </dd>
                <dt className="text-[13px] text-muted-foreground">Facility</dt>
                <dd className="m-0 font-semibold break-words">
                  {facility ? `${facility.name}, ${facilityLocation(facility)}` : '—'}
                </dd>
                <dt className="text-[13px] text-muted-foreground">Priority</dt>
                <dd className="m-0">
                  <PriorityLabel priority={report.priority} />
                </dd>
                <dt className="text-[13px] text-muted-foreground">Reporter</dt>
                <dd className="m-0 font-semibold break-words">{report.reporter_name}</dd>
                <dt className="text-[13px] text-muted-foreground">Submitted</dt>
                <dd className="m-0 font-semibold">{formatDate(report.created_at)}</dd>
                <dt className="text-[13px] text-muted-foreground">Updated</dt>
                <dd className="m-0 font-semibold">{formatDate(report.updated_at)}</dd>
              </dl>

              <section aria-labelledby="admin-report-description" className="flex flex-col gap-2">
                <h3 id="admin-report-description" className="text-base font-bold">
                  Description
                </h3>
                <p className="break-words whitespace-pre-line">{report.description}</p>
              </section>

              <AssignedTechnician reportId={report.id} />
            </SheetBody>

            <SheetFooter>
              {isReportEditable(report) ? (
                <>
                  <Button variant="secondary" onClick={() => onDelete(report)}>
                    <Trash2 className="size-4" aria-hidden="true" />
                    Delete
                  </Button>
                  <Button variant="secondary" onClick={() => onEdit(report)}>
                    <Pencil className="size-4" aria-hidden="true" />
                    Edit
                  </Button>
                  <Button onClick={() => onAssign(report)}>
                    <UserPlus className="size-4" aria-hidden="true" />
                    Assign technician
                  </Button>
                </>
              ) : (
                <p className="flex items-start gap-2 text-[13px] text-muted-foreground">
                  <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  Editing and deleting are available only while a report is Open.
                </p>
              )}
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function AssignedTechnician({ reportId }: { reportId: number }) {
  const assignments = useAssignments({ report_id: reportId })
  const technicians = useTechnicians()
  const assignment = assignments.data?.[0] ?? null
  const technician = assignment
    ? technicians.data?.find((item) => item.id === assignment.technician_id)
    : undefined

  return (
    <section aria-labelledby="admin-report-technician" className="flex flex-col gap-2">
      <h3 id="admin-report-technician" className="text-base font-bold">
        Assigned technician
      </h3>
      {assignments.isPending ? (
        <Skeleton className="h-10" />
      ) : assignments.isError ? (
        <p className="text-muted-foreground">Technician details could not be loaded.</p>
      ) : assignment ? (
        <p>
          <span className="font-semibold">
            {technician?.name ?? `Technician ${assignment.technician_id}`}
          </span>
          {technician ? (
            <span className="text-muted-foreground"> · {technician.specialization}</span>
          ) : null}
          <span className="block text-[13px] text-muted-foreground">
            Assigned {formatDate(assignment.assigned_at)} · {assignment.status}
          </span>
        </p>
      ) : (
        <p className="text-muted-foreground">No technician has been assigned yet.</p>
      )}
    </section>
  )
}
