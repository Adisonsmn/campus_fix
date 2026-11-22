import { useMemo, useState } from 'react'
import { ClipboardCheck, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/shared/empty-state'
import { EntityCard } from '@/components/shared/entity-card'
import { ErrorState } from '@/components/shared/error-state'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate, formatReportId, pluralize } from '@/lib/format'
import { AssignmentStatusBadge } from '@/features/assignments/assignment-status-badge'
import { useAssignments } from '@/features/assignments/hooks'
import { ASSIGNMENT_STATUSES, type Assignment } from '@/features/assignments/types'
import { useFacilities } from '@/features/facilities/hooks'
import { PriorityLabel } from '@/features/reports/priority-label'
import { useReports } from '@/features/reports/hooks'
import { useFacilityMap } from '@/features/reports/use-facility-map'
import { DEMO_TECHNICIAN_ID } from '@/features/roles/roles'

const TASKS_PATH = '/technician/assignments'

// Active work first, finished work last; newest first inside each group.
const STATUS_ORDER = { 'In Progress': 0, Assigned: 1, Completed: 2 } as const

export function TechnicianMyAssignmentsPage() {
  const assignmentsQuery = useAssignments({ technician_id: DEMO_TECHNICIAN_ID })
  const reportsQuery = useReports()
  const facilitiesQuery = useFacilities()
  const facilityMap = useFacilityMap(facilitiesQuery.data)
  const [statusFilter, setStatusFilter] = useState('')

  const reportMap = useMemo(
    () => new Map((reportsQuery.data ?? []).map((report) => [report.id, report])),
    [reportsQuery.data],
  )

  const assignments = assignmentsQuery.data
  const visible = useMemo(
    () =>
      (assignments ?? [])
        .filter((assignment) => !statusFilter || assignment.status === statusFilter)
        .sort(
          (a, b) =>
            STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
            b.assigned_at.localeCompare(a.assigned_at) ||
            b.id - a.id,
        ),
    [assignments, statusFilter],
  )

  const titleOf = (assignment: Assignment) =>
    reportMap.get(assignment.report_id)?.title ?? formatReportId(assignment.report_id)
  const facilityOf = (assignment: Assignment) => {
    const report = reportMap.get(assignment.report_id)
    return report ? facilityMap.get(report.facility_id)?.name : undefined
  }
  const priorityOf = (assignment: Assignment) => reportMap.get(assignment.report_id)?.priority

  const loading = assignmentsQuery.isPending || reportsQuery.isPending || facilitiesQuery.isPending
  const loadError = assignmentsQuery.error ?? reportsQuery.error ?? facilitiesQuery.error

  return (
    <>
      <PageHeader
        title="My Assignments"
        description="Repairs assigned to you. Open a task to start work and record notes."
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <NativeSelect
          aria-label="Filter by status"
          wrapperClassName="md:w-52"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="">Status: All</option>
          {ASSIGNMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </NativeSelect>
      </div>

      {loading ? (
        <div role="status" aria-label="Loading assignments" className="flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-[68px] rounded-xl" />
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
      ) : assignments && assignments.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No assignments yet"
          description="When an administrator assigns a repair to you, it will show up here."
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No assignments with this status"
          description="Choose another status to see your other tasks."
          actions={
            <Button variant="secondary" onClick={() => setStatusFilter('')}>
              Show all assignments
            </Button>
          }
        />
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Task</TableHead>
                  <TableHead>Facility</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((assignment) => {
                  const priority = priorityOf(assignment)
                  return (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <Link
                          to={`${TASKS_PATH}/${assignment.id}`}
                          className="font-semibold hover:underline"
                        >
                          {titleOf(assignment)}
                        </Link>
                        <p className="text-[13px] text-muted-foreground">
                          {formatReportId(assignment.report_id)}
                        </p>
                      </TableCell>
                      <TableCell>{facilityOf(assignment) ?? '—'}</TableCell>
                      <TableCell>
                        {priority ? <PriorityLabel priority={priority} /> : '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(assignment.assigned_at)}
                      </TableCell>
                      <TableCell>
                        <AssignmentStatusBadge status={assignment.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <Button asChild variant="secondary" size="sm">
                            <Link
                              to={`${TASKS_PATH}/${assignment.id}`}
                              aria-label={`View task: ${titleOf(assignment)}`}
                            >
                              <Eye className="size-4" aria-hidden="true" />
                              View Task
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <ul className="flex flex-col gap-3 md:hidden">
            {visible.map((assignment) => {
              const priority = priorityOf(assignment)
              return (
                <li key={assignment.id}>
                  <EntityCard
                    title={titleOf(assignment)}
                    subtitle={`${formatReportId(assignment.report_id)} · ${facilityOf(assignment) ?? 'Unknown facility'}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <AssignmentStatusBadge status={assignment.status} />
                      {priority ? <PriorityLabel priority={priority} /> : null}
                    </div>
                    <Button asChild variant="secondary" className="w-full">
                      <Link to={`${TASKS_PATH}/${assignment.id}`}>
                        <Eye className="size-4" aria-hidden="true" />
                        View Task
                      </Link>
                    </Button>
                  </EntityCard>
                </li>
              )
            })}
          </ul>

          <p className="text-[13px] text-muted-foreground" aria-live="polite">
            {pluralize(visible.length, 'assignment')}
          </p>
        </>
      )}
    </>
  )
}
