import { useState } from 'react'
import { Circle, CircleCheck, FileText, Inbox, Loader, UserPlus } from 'lucide-react'

import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/section-card'
import { StatCard, StatCardSkeletons } from '@/components/shared/stat-card'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatReportId, formatShortDate } from '@/lib/format'
import {
  AssignmentFormSheet,
  type AssignmentFormTarget,
} from '@/features/assignments/assignment-form-sheet'
import { useFacilities } from '@/features/facilities/hooks'
import { useReports } from '@/features/reports/hooks'
import { PriorityLabel } from '@/features/reports/priority-label'
import { useFacilityMap } from '@/features/reports/use-facility-map'
import { PRIORITIES, type Report } from '@/features/reports/types'

const LIST_COUNT = 5

// High priority first, then the longest-waiting report.
const PRIORITY_RANK = Object.fromEntries(PRIORITIES.map((priority, index) => [priority, -index]))

export function AdminDashboardPage() {
  const reportsQuery = useReports()
  const facilitiesQuery = useFacilities()
  const facilityMap = useFacilityMap(facilitiesQuery.data)
  const [assignTarget, setAssignTarget] = useState<AssignmentFormTarget | null>(null)

  const reports = reportsQuery.data ?? []
  const count = (status: Report['status']) =>
    reports.filter((report) => report.status === status).length

  const needAttention = reports
    .filter((report) => report.status === 'Open')
    .sort(
      (a, b) =>
        PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
        a.created_at.localeCompare(b.created_at) ||
        a.id - b.id,
    )
    .slice(0, LIST_COUNT)
  const recentlyUpdated = [...reports]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at) || b.id - a.id)
    .slice(0, LIST_COUNT)

  const loading = reportsQuery.isPending || facilitiesQuery.isPending
  const loadError = reportsQuery.error ?? facilitiesQuery.error
  const facilityName = (report: Report) =>
    facilityMap.get(report.facility_id)?.name ?? 'Unknown facility'

  const listSkeleton = (
    <div role="status" aria-label="Loading reports" className="flex flex-col gap-3">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-14 rounded-lg" />
      ))}
    </div>
  )
  const listError = loadError ? (
    <ErrorState
      title="Could not load reports"
      message={loadError.message}
      onRetry={() => {
        void reportsQuery.refetch()
        void facilitiesQuery.refetch()
      }}
    />
  ) : null

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Track incoming reports and assign technicians where work is needed."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <StatCardSkeletons count={4} />
        ) : (
          <>
            <StatCard icon={FileText} label="Total Reports" value={reports.length} />
            <StatCard icon={Circle} label="Open" value={count('Open')} />
            <StatCard icon={Loader} label="In Progress" value={count('In Progress')} />
            <StatCard icon={CircleCheck} label="Resolved" value={count('Resolved')} />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <SectionCard title="Needs attention" link={{ to: '/admin/reports', label: 'All reports' }}>
          {loading ? (
            listSkeleton
          ) : listError ? (
            listError
          ) : needAttention.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Nothing waiting for a technician"
              description="Every report has been assigned. New reports will appear here."
            />
          ) : (
            <ul className="flex flex-col divide-y">
              {needAttention.map((report) => (
                <li
                  key={report.id}
                  className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold break-words">{report.title}</p>
                    <p className="text-[13px] text-muted-foreground">
                      {formatReportId(report.id)} · {facilityName(report)}
                    </p>
                    <PriorityLabel priority={report.priority} className="mt-1 text-[13px]" />
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="max-sm:w-full"
                    aria-label={`Assign technician to ${report.title}`}
                    onClick={() => setAssignTarget({ assignment: null, presetReportId: report.id })}
                  >
                    <UserPlus className="size-4" aria-hidden="true" />
                    Assign
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Recently updated" link={{ to: '/admin/reports', label: 'All reports' }}>
          {loading ? (
            listSkeleton
          ) : listError ? (
            listError
          ) : recentlyUpdated.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No reports yet"
              description="Reports submitted by students and staff will show up here."
            />
          ) : (
            <ul className="flex flex-col divide-y">
              {recentlyUpdated.map((report) => (
                <li
                  key={report.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="font-semibold break-words">{report.title}</p>
                    <p className="text-[13px] text-muted-foreground">
                      {formatReportId(report.id)} · Updated {formatShortDate(report.updated_at)}
                    </p>
                  </div>
                  <StatusBadge status={report.status} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <AssignmentFormSheet
        target={assignTarget}
        onOpenChange={(open) => {
          if (!open) setAssignTarget(null)
        }}
      />
    </>
  )
}
