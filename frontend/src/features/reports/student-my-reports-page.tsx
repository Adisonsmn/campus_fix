import { useMemo, useState } from 'react'
import { FileText, Plus, Search, SearchX, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { PageHeader } from '@/components/shared/page-header'
import { Pagination } from '@/components/shared/pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/lib/api-client'
import { formatReportId } from '@/lib/format'
import { useFacilities } from '@/features/facilities/hooks'
import { useFacilityMap } from '@/features/reports/use-facility-map'
import { useDeleteReport, useReports } from '@/features/reports/hooks'
import { ReportsTable } from '@/features/reports/reports-table'
import { REPORT_STATUSES, type Report } from '@/features/reports/types'
import { ROLES } from '@/features/roles/roles'

const PAGE_SIZE = 5
const SORT_OPTIONS = { newest: 'Newest first', oldest: 'Oldest first' } as const
type SortKey = keyof typeof SORT_OPTIONS

export function StudentMyReportsPage() {
  const reporterName = ROLES.student.persona.name
  const navigate = useNavigate()
  const reportsQuery = useReports({ reporter_name: reporterName })
  const facilitiesQuery = useFacilities()
  const facilityMap = useFacilityMap(facilitiesQuery.data)
  const deleteReport = useDeleteReport()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sort, setSort] = useState<SortKey>('newest')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null)

  const reports = reportsQuery.data

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const items = (reports ?? []).filter((report) => {
      if (statusFilter && report.status !== statusFilter) return false
      if (!needle) return true
      const facilityName = facilityMap.get(report.facility_id)?.name ?? ''
      return (
        report.title.toLowerCase().includes(needle) || facilityName.toLowerCase().includes(needle)
      )
    })
    const direction = sort === 'newest' ? -1 : 1
    return items.sort(
      (a, b) => direction * (a.created_at.localeCompare(b.created_at) || a.id - b.id),
    )
  }, [reports, search, statusFilter, sort, facilityMap])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const firstShown = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const lastShown = (currentPage - 1) * PAGE_SIZE + pageItems.length

  const hasFilters = search.trim() !== '' || statusFilter !== ''
  const clearFilters = () => {
    setSearch('')
    setStatusFilter('')
    setPage(1)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    try {
      await deleteReport.mutateAsync(target.id)
      toast.success('Report deleted', { description: formatReportId(target.id) })
    } catch (error) {
      if (!(error instanceof ApiError)) throw error
      toast.error('Could not delete the report', { description: error.message })
    } finally {
      setDeleteTarget(null)
    }
  }

  const newReportButton = (
    <Button asChild>
      <Link to="/student/reports/new">
        <Plus className="size-[18px]" aria-hidden="true" />
        New Report
      </Link>
    </Button>
  )

  return (
    <>
      <PageHeader
        title="My Reports"
        description="Find, review and manage every maintenance report you have submitted."
        actions={newReportButton}
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative md:max-w-[420px] md:flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="Search reports by title or facility"
            placeholder="Search by title or facility"
            className="bg-card pl-10"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />
        </div>
        <NativeSelect
          aria-label="Filter by status"
          wrapperClassName="md:w-48"
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value)
            setPage(1)
          }}
        >
          <option value="">Status: All</option>
          {REPORT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="Sort reports"
          wrapperClassName="md:w-48"
          value={sort}
          onChange={(event) => {
            setSort(event.target.value as SortKey)
            setPage(1)
          }}
        >
          {(Object.keys(SORT_OPTIONS) as SortKey[]).map((key) => (
            <option key={key} value={key}>
              Sort: {SORT_OPTIONS[key]}
            </option>
          ))}
        </NativeSelect>
      </div>

      {reportsQuery.isPending || facilitiesQuery.isPending ? (
        <div role="status" aria-label="Loading reports" className="flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-[68px] rounded-xl" />
          ))}
        </div>
      ) : reportsQuery.isError || facilitiesQuery.isError ? (
        <ErrorState
          title="Could not load your reports"
          message={(reportsQuery.error ?? facilitiesQuery.error)?.message ?? 'Please try again.'}
          onRetry={() => {
            void reportsQuery.refetch()
            void facilitiesQuery.refetch()
          }}
        />
      ) : reports && reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="You have not submitted any reports yet"
          description="Spotted something broken on campus? Report it and follow the repair here."
          actions={newReportButton}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No reports match your search"
          description="Check the spelling, or clear your search and filter to see every report."
          actions={
            <Button variant="secondary" onClick={clearFilters}>
              <X className="size-4" aria-hidden="true" />
              Clear search and filter
            </Button>
          }
        />
      ) : (
        <>
          <ReportsTable
            reports={pageItems}
            facilities={facilityMap}
            onView={(report) => void navigate(`/student/reports/${report.id}`)}
            onEdit={(report) => void navigate(`/student/reports/${report.id}/edit`)}
            onDelete={setDeleteTarget}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] text-muted-foreground" aria-live="polite">
              Showing {firstShown}–{lastShown} of {filtered.length}{' '}
              {filtered.length === 1 ? 'report' : 'reports'}
              {hasFilters ? ` (filtered from ${reports?.length ?? 0})` : ''}
            </p>
            <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
          </div>
        </>
      )}

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={deleteTarget ? `Delete report “${deleteTarget.title}”?` : 'Delete report?'}
        description={
          deleteTarget
            ? `${formatReportId(deleteTarget.id)} will be permanently removed. This cannot be undone.`
            : ''
        }
        pending={deleteReport.isPending}
        confirmLabel="Delete report"
        onConfirm={() => void confirmDelete()}
      />
    </>
  )
}
