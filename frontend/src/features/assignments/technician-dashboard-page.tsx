import { CircleCheck, ClipboardCheck, Eye, Loader, UserCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/section-card'
import { StatCard, StatCardSkeletons } from '@/components/shared/stat-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatReportId, formatShortDate } from '@/lib/format'
import { AssignmentStatusBadge } from '@/features/assignments/assignment-status-badge'
import { useAssignments } from '@/features/assignments/hooks'
import type { AssignmentStatus } from '@/features/assignments/types'
import { useFacilities } from '@/features/facilities/hooks'
import { PriorityLabel } from '@/features/reports/priority-label'
import { useReports } from '@/features/reports/hooks'
import { useFacilityMap } from '@/features/reports/use-facility-map'
import { DEMO_TECHNICIAN_ID, ROLES } from '@/features/roles/roles'

const LIST_COUNT = 5

// Same ordering as My Assignments: active work first, finished work last.
const STATUS_ORDER = { 'In Progress': 0, Assigned: 1, Completed: 2 } as const

export function TechnicianDashboardPage() {
  const assignmentsQuery = useAssignments({ technician_id: DEMO_TECHNICIAN_ID })
  const reportsQuery = useReports()
  const facilitiesQuery = useFacilities()
  const facilityMap = useFacilityMap(facilitiesQuery.data)

  const assignments = assignmentsQuery.data ?? []
  const reportMap = new Map((reportsQuery.data ?? []).map((report) => [report.id, report]))
  const count = (status: AssignmentStatus) =>
    assignments.filter((assignment) => assignment.status === status).length

  const tasks = [...assignments]
    .sort(
      (a, b) =>
        STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
        b.assigned_at.localeCompare(a.assigned_at) ||
        b.id - a.id,
    )
    .slice(0, LIST_COUNT)

  const loading = assignmentsQuery.isPending || reportsQuery.isPending || facilitiesQuery.isPending
  const loadError = assignmentsQuery.error ?? reportsQuery.error ?? facilitiesQuery.error
  const firstName = ROLES.technician.persona.name.split(' ')[0]

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${firstName}. Here is the work waiting for you.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <StatCardSkeletons count={3} />
        ) : (
          <>
            <StatCard icon={UserCheck} label="Assigned" value={count('Assigned')} />
            <StatCard icon={Loader} label="In Progress" value={count('In Progress')} />
            <StatCard icon={CircleCheck} label="Completed" value={count('Completed')} />
          </>
        )}
      </div>

      <SectionCard
        title="My Assignments"
        link={{ to: '/technician/assignments', label: 'View all assignments' }}
      >
        {loading ? (
          <div role="status" aria-label="Loading assignments" className="flex flex-col gap-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : loadError ? (
          <ErrorState
            title="Could not load your assignments"
            message={loadError.message}
            onRetry={() => {
              void assignmentsQuery.refetch()
              void reportsQuery.refetch()
              void facilitiesQuery.refetch()
            }}
          />
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No assignments yet"
            description="When an administrator assigns a repair to you, it will show up here."
          />
        ) : (
          <ul className="flex flex-col divide-y">
            {tasks.map((assignment) => {
              const report = reportMap.get(assignment.report_id)
              const title = report?.title ?? formatReportId(assignment.report_id)
              const facility = report ? facilityMap.get(report.facility_id)?.name : undefined
              return (
                <li
                  key={assignment.id}
                  className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold break-words">{title}</p>
                    <p className="text-[13px] text-muted-foreground">
                      {formatReportId(assignment.report_id)} · {facility ?? 'Unknown facility'} ·
                      Assigned {formatShortDate(assignment.assigned_at)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <AssignmentStatusBadge status={assignment.status} />
                      {report ? <PriorityLabel priority={report.priority} /> : null}
                    </div>
                  </div>
                  <Button asChild variant="secondary" size="sm" className="max-md:w-full">
                    <Link
                      to={`/technician/assignments/${assignment.id}`}
                      aria-label={`View task: ${title}`}
                    >
                      <Eye className="size-4" aria-hidden="true" />
                      View Task
                    </Link>
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </SectionCard>
    </>
  )
}
