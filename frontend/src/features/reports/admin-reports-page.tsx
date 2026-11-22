import { useMemo, useState } from 'react'
import { FileText, Search, SearchX, X } from 'lucide-react'
import { toast } from 'sonner'

import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/lib/api-client'
import { formatReportId, pluralize } from '@/lib/format'
import {
  AssignmentFormSheet,
  type AssignmentFormTarget,
} from '@/features/assignments/assignment-form-sheet'
import { useFacilities } from '@/features/facilities/hooks'
import { AdminReportDetailSheet } from '@/features/reports/admin-report-detail-sheet'
import { AdminReportFormSheet } from '@/features/reports/admin-report-form-sheet'
import { useDeleteReport, useReports } from '@/features/reports/hooks'
import { ReportsTable } from '@/features/reports/reports-table'
import { PRIORITIES, REPORT_STATUSES, type Report } from '@/features/reports/types'
import { useFacilityMap } from '@/features/reports/use-facility-map'

export function AdminReportsPage() {
  const reportsQuery = useReports()
  const facilitiesQuery = useFacilities()
  const facilityMap = useFacilityMap(facilitiesQuery.data)
  const deleteReport = useDeleteReport()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [facilityFilter, setFacilityFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [viewTarget, setViewTarget] = useState<Report | null>(null)
  const [editTarget, setEditTarget] = useState<Report | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null)
  const [assignTarget, setAssignTarget] = useState<AssignmentFormTarget | null>(null)
  const assignReport = (report: Report) =>
    setAssignTarget({ assignment: null, presetReportId: report.id })

  const reports = reportsQuery.data

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (reports ?? [])
      .filter((report) => {
        if (statusFilter && report.status !== statusFilter) return false
        if (facilityFilter && String(report.facility_id) !== facilityFilter) return false
        if (priorityFilter && report.priority !== priorityFilter) return false
        if (!needle) return true
        const facilityName = facilityMap.get(report.facility_id)?.name ?? ''
        return (
          report.title.toLowerCase().includes(needle) ||
          facilityName.toLowerCase().includes(needle) ||
          report.reporter_name.toLowerCase().includes(needle)
        )
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id)
  }, [reports, search, statusFilter, facilityFilter, priorityFilter, facilityMap])

  const hasFilters =
    search.trim() !== '' || statusFilter !== '' || facilityFilter !== '' || priorityFilter !== ''
  const clearFilters = () => {
    setSearch('')
    setStatusFilter('')
    setFacilityFilter('')
    setPriorityFilter('')
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
      setViewTarget(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Reports"
        description="Review every submitted report and manage the ones that are still Open."
      />

      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
        <div className="relative md:max-w-[420px] md:min-w-[260px] md:flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="Search reports by title, facility or reporter"
            placeholder="Search title, facility or reporter"
            className="bg-card pl-10"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <NativeSelect
          aria-label="Filter by status"
          wrapperClassName="md:w-44"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="">Status: All</option>
          {REPORT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="Filter by facility"
          wrapperClassName="md:w-52"
          value={facilityFilter}
          onChange={(event) => setFacilityFilter(event.target.value)}
        >
          <option value="">Facility: All</option>
          {(facilitiesQuery.data ?? []).map((facility) => (
            <option key={facility.id} value={facility.id}>
              {facility.name}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="Filter by priority"
          wrapperClassName="md:w-44"
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value)}
        >
          <option value="">Priority: All</option>
          {PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </NativeSelect>
      </div>

      {reportsQuery.isPending || facilitiesQuery.isPending ? (
        <div role="status" aria-label="Loading reports" className="flex flex-col gap-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-[68px] rounded-xl" />
          ))}
        </div>
      ) : reportsQuery.isError || facilitiesQuery.isError ? (
        <ErrorState
          title="Could not load reports"
          message={(reportsQuery.error ?? facilitiesQuery.error)?.message ?? 'Please try again.'}
          onRetry={() => {
            void reportsQuery.refetch()
            void facilitiesQuery.refetch()
          }}
        />
      ) : reports && reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports yet"
          description="Reports submitted by students and staff will appear here."
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No reports match your search"
          description="Check the spelling, or clear your search and filters to see every report."
          actions={
            <Button variant="secondary" onClick={clearFilters}>
              <X className="size-4" aria-hidden="true" />
              Clear search and filters
            </Button>
          }
        />
      ) : (
        <>
          <ReportsTable
            reports={visible}
            facilities={facilityMap}
            showReporter
            onView={setViewTarget}
            onAssign={assignReport}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
          />
          <p className="text-[13px] text-muted-foreground" aria-live="polite">
            {hasFilters
              ? `Showing ${visible.length} of ${pluralize(reports?.length ?? 0, 'report')}`
              : pluralize(visible.length, 'report')}
          </p>
        </>
      )}

      <AdminReportDetailSheet
        report={viewTarget}
        facility={viewTarget ? facilityMap.get(viewTarget.facility_id) : undefined}
        onOpenChange={(open) => {
          if (!open) setViewTarget(null)
        }}
        onAssign={(report) => {
          setViewTarget(null)
          assignReport(report)
        }}
        onEdit={(report) => {
          setViewTarget(null)
          setEditTarget(report)
        }}
        onDelete={setDeleteTarget}
      />

      <AssignmentFormSheet
        target={assignTarget}
        onOpenChange={(open) => {
          if (!open) setAssignTarget(null)
        }}
      />

      <AdminReportFormSheet
        report={editTarget}
        facilities={facilitiesQuery.data ?? []}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null)
        }}
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={deleteTarget ? `Delete report “${deleteTarget.title}”?` : 'Delete report?'}
        description={
          deleteTarget
            ? `${formatReportId(deleteTarget.id)} from ${deleteTarget.reporter_name} will be permanently removed. This cannot be undone.`
            : ''
        }
        pending={deleteReport.isPending}
        confirmLabel="Delete report"
        onConfirm={() => void confirmDelete()}
      />
    </>
  )
}
