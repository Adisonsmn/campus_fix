import { useState } from 'react'
import { ArrowLeft, CalendarDays, Lock, Pencil, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Avatar } from '@/components/layout/persona-card'
import { Breadcrumb } from '@/components/shared/breadcrumb'
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog'
import { ErrorState } from '@/components/shared/error-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/lib/api-client'
import { formatDate, formatReportId, parseRouteId } from '@/lib/format'
import { useAssignments } from '@/features/assignments/hooks'
import { useFacilities } from '@/features/facilities/hooks'
import { useDeleteReport, useReport } from '@/features/reports/hooks'
import { PriorityLabel } from '@/features/reports/priority-label'
import { isReportEditable } from '@/features/reports/rules'
import { facilityLocation } from '@/features/reports/schema'
import { StatusStepper } from '@/features/reports/status-stepper'
import { useTechnicians } from '@/features/technicians/hooks'

const REPORTS_PATH = '/student/reports'

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function StudentReportDetailPage() {
  const { id } = useParams()
  const reportId = parseRouteId(id)
  const navigate = useNavigate()

  const reportQuery = useReport(reportId)
  const facilitiesQuery = useFacilities()
  const assignmentsQuery = useAssignments({ report_id: reportId ?? undefined })
  const techniciansQuery = useTechnicians()
  const deleteReport = useDeleteReport()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  if (reportId === null) {
    return <NotFound message="This report link is not valid." />
  }
  if (reportQuery.isError) {
    return <NotFound message={reportQuery.error.message} />
  }
  if (reportQuery.isPending) {
    return (
      <div role="status" aria-label="Loading report" className="flex flex-col gap-4">
        <Skeleton className="h-10 w-80" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    )
  }

  const report = reportQuery.data
  const facility = facilitiesQuery.data?.find((item) => item.id === report.facility_id)
  const assignment = assignmentsQuery.data?.[0] ?? null
  const technician = assignment
    ? techniciansQuery.data?.find((item) => item.id === assignment.technician_id)
    : undefined
  const editable = isReportEditable(report)

  async function confirmDelete() {
    try {
      await deleteReport.mutateAsync(report.id)
      toast.success('Report deleted', { description: formatReportId(report.id) })
      void navigate(REPORTS_PATH)
    } catch (error) {
      if (!(error instanceof ApiError)) throw error
      toast.error('Could not delete the report', { description: error.message })
      setConfirmingDelete(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-3">
          <Breadcrumb
            parents={[{ label: 'My Reports', to: REPORTS_PATH }]}
            current={formatReportId(report.id)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[22px] leading-7 font-extrabold tracking-tight break-words md:text-2xl md:leading-8">
              {report.title}
            </h1>
            <StatusBadge status={report.status} />
          </div>
          <p className="text-muted-foreground">
            {formatReportId(report.id)} · Submitted {formatDate(report.created_at)}
          </p>
        </div>
        <Button asChild variant="secondary" className="max-md:hidden">
          <Link to={REPORTS_PATH}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to My Reports
          </Link>
        </Button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card title="Issue description">
            <p className="break-words whitespace-pre-line">{report.description}</p>
          </Card>

          <Card title="Maintenance progress">
            <StatusStepper
              status={report.status}
              createdAt={report.created_at}
              assignedAt={assignment?.assigned_at ?? null}
              repairNotes={assignment?.repair_notes ?? null}
            />
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card title="Report details">
            <dl className="grid grid-cols-[96px_1fr] items-start gap-x-3 gap-y-3">
              <dt className="text-[13px] text-muted-foreground">Report ID</dt>
              <dd className="m-0 font-semibold">{formatReportId(report.id)}</dd>
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
              <dt className="text-[13px] text-muted-foreground">Submitted</dt>
              <dd className="m-0 font-semibold">{formatDate(report.created_at)}</dd>
              <dt className="text-[13px] text-muted-foreground">Reporter</dt>
              <dd className="m-0 font-semibold break-words">{report.reporter_name}</dd>
            </dl>
          </Card>

          <Card title="Assigned technician">
            {assignmentsQuery.isError ? (
              <p className="text-muted-foreground">Technician details could not be loaded.</p>
            ) : assignmentsQuery.isPending ? (
              <Skeleton className="h-12" />
            ) : assignment ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Avatar initials={technician ? initialsOf(technician.name) : '?'} />
                  <div className="min-w-0">
                    <p className="font-bold break-words">
                      {technician?.name ?? `Technician ${assignment.technician_id}`}
                    </p>
                    {technician ? (
                      <p className="text-[13px] text-muted-foreground">
                        {technician.specialization} technician
                      </p>
                    ) : null}
                  </div>
                </div>
                <p className="flex items-center gap-2 border-t pt-3 text-[13px] text-muted-foreground">
                  <CalendarDays className="size-4" aria-hidden="true" />
                  Assigned {formatDate(assignment.assigned_at)}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">No technician has been assigned yet.</p>
            )}
          </Card>

          <Card title="Actions">
            {editable ? (
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <Button asChild className="flex-1">
                  <Link to={`${REPORTS_PATH}/${report.id}/edit`}>
                    <Pencil className="size-4" aria-hidden="true" />
                    Edit report
                  </Link>
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setConfirmingDelete(true)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete report
                </Button>
              </div>
            ) : (
              <p className="flex items-start gap-3 rounded-lg border-[1.5px] border-navy p-3">
                <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                Editing and deleting are available only while a report is Open.
              </p>
            )}
            <Button asChild variant="secondary" className="mt-3 w-full">
              <Link to={REPORTS_PATH}>
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back to My Reports
              </Link>
            </Button>
          </Card>
        </div>
      </div>

      <ConfirmDeleteDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title={`Delete report “${report.title}”?`}
        description={`${formatReportId(report.id)} will be permanently removed. This cannot be undone.`}
        pending={deleteReport.isPending}
        confirmLabel="Delete report"
        onConfirm={() => void confirmDelete()}
      />
    </>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-card md:p-6">
      <h2 className="text-base font-bold">{title}</h2>
      {children}
    </section>
  )
}

function NotFound({ message }: { message: string }) {
  return (
    <>
      <ErrorState title="Report not found" message={message} />
      <Button asChild variant="secondary" className="self-start">
        <Link to={REPORTS_PATH}>Back to My Reports</Link>
      </Button>
    </>
  )
}
