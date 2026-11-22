import {
  CalendarDays,
  ChevronRight,
  CircleCheck,
  FileText,
  Loader,
  MapPin,
  Plus,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/section-card'
import { StatCard, StatCardSkeletons } from '@/components/shared/stat-card'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatReportId, formatShortDate } from '@/lib/format'
import { useFacilities } from '@/features/facilities/hooks'
import { useReports } from '@/features/reports/hooks'
import { useFacilityMap } from '@/features/reports/use-facility-map'
import { REPORT_STATUSES, type ReportStatus } from '@/features/reports/types'
import { ROLES } from '@/features/roles/roles'

const RECENT_COUNT = 5

const STATUS_MEANINGS: Record<ReportStatus, string> = {
  Open: 'Submitted and waiting for an administrator to review it.',
  Assigned: 'A technician has been chosen for the repair.',
  'In Progress': 'The technician has started working on it.',
  Resolved: 'The issue is fixed and the report is closed.',
}

export function StudentDashboardPage() {
  const { name } = ROLES.student.persona
  const reportsQuery = useReports({ reporter_name: name })
  const facilitiesQuery = useFacilities()
  const facilityMap = useFacilityMap(facilitiesQuery.data)

  const reports = reportsQuery.data
  const active = (reports ?? []).filter((report) => report.status !== 'Resolved').length
  const resolved = (reports ?? []).filter((report) => report.status === 'Resolved').length
  const recent = [...(reports ?? [])]
    .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id)
    .slice(0, RECENT_COUNT)

  const newReportButton = (
    <Button asChild>
      <Link to="/student/reports/new">
        <Plus className="size-[18px]" aria-hidden="true" />
        New Report
      </Link>
    </Button>
  )

  const loading = reportsQuery.isPending || facilitiesQuery.isPending
  const loadError = reportsQuery.error ?? facilitiesQuery.error

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${name.split(' ')[0]}. Here is where your reports stand.`}
        actions={newReportButton}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <StatCardSkeletons count={3} />
        ) : loadError ? null : (
          <>
            <StatCard icon={FileText} label="Total Reports" value={reports?.length ?? 0} />
            <StatCard icon={Loader} label="Active" value={active} />
            <StatCard icon={CircleCheck} label="Resolved" value={resolved} />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <SectionCard
          title="Recent Reports"
          link={{ to: '/student/reports', label: 'View All Reports' }}
        >
          {loading ? (
            <div role="status" aria-label="Loading recent reports" className="flex flex-col gap-3">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : loadError ? (
            <ErrorState
              title="Could not load your reports"
              message={loadError.message}
              onRetry={() => {
                void reportsQuery.refetch()
                void facilitiesQuery.refetch()
              }}
            />
          ) : recent.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="You have not submitted any reports yet"
              description="Spotted something broken on campus? Report it and follow the repair here."
              actions={newReportButton}
            />
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>ID</TableHead>
                      <TableHead>Issue</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recent.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-semibold whitespace-nowrap">
                          {formatReportId(report.id)}
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold">{report.title}</p>
                          <p className="text-[13px] text-muted-foreground">
                            {facilityMap.get(report.facility_id)?.name ?? 'Unknown facility'}
                          </p>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatShortDate(report.created_at)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={report.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <Button asChild variant="secondary" size="sm">
                              <Link
                                to={`/student/reports/${report.id}`}
                                aria-label={`View report: ${report.title}`}
                              >
                                View
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <ul className="flex flex-col gap-3 md:hidden">
                {recent.map((report) => (
                  <li
                    key={report.id}
                    className="flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-card"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] text-muted-foreground">
                        {formatReportId(report.id)}
                      </span>
                      <StatusBadge status={report.status} />
                    </div>
                    <h3 className="font-bold">{report.title}</h3>
                    <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                      <MapPin className="size-4" aria-hidden="true" />
                      {facilityMap.get(report.facility_id)?.name ?? 'Unknown facility'}
                    </p>
                    <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                      <CalendarDays className="size-4" aria-hidden="true" />
                      Submitted {formatShortDate(report.created_at)}
                    </p>
                    <Button asChild variant="secondary" className="w-full">
                      <Link to={`/student/reports/${report.id}`}>
                        <ChevronRight className="size-4" aria-hidden="true" />
                        View details
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </SectionCard>

        <SectionCard title="What each status means">
          <ul className="flex flex-col divide-y">
            {REPORT_STATUSES.map((status) => (
              <li
                key={status}
                className="flex flex-col items-start gap-2 py-3 first:pt-0 last:pb-0"
              >
                <StatusBadge status={status} />
                <p className="text-[13px] text-muted-foreground">{STATUS_MEANINGS[status]}</p>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </>
  )
}
