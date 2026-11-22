import { useMemo, useState } from 'react'
import { ClipboardList, Plus, Search, SearchX, X } from 'lucide-react'
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
import { AssignmentDetailSheet } from '@/features/assignments/assignment-detail-sheet'
import {
  AssignmentFormSheet,
  type AssignmentFormTarget,
} from '@/features/assignments/assignment-form-sheet'
import { AssignmentsList } from '@/features/assignments/assignments-list'
import { useAssignments, useDeleteAssignment } from '@/features/assignments/hooks'
import { ASSIGNMENT_STATUSES, type Assignment } from '@/features/assignments/types'
import { useReports } from '@/features/reports/hooks'
import { useTechnicians } from '@/features/technicians/hooks'

export function AdminAssignmentsPage() {
  const assignmentsQuery = useAssignments()
  const reportsQuery = useReports()
  const techniciansQuery = useTechnicians()
  const deleteAssignment = useDeleteAssignment()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [technicianFilter, setTechnicianFilter] = useState('')
  const [formTarget, setFormTarget] = useState<AssignmentFormTarget | null>(null)
  const [viewTarget, setViewTarget] = useState<Assignment | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null)

  const reportMap = useMemo(
    () => new Map((reportsQuery.data ?? []).map((report) => [report.id, report])),
    [reportsQuery.data],
  )
  const technicianMap = useMemo(
    () => new Map((techniciansQuery.data ?? []).map((technician) => [technician.id, technician])),
    [techniciansQuery.data],
  )

  const assignments = assignmentsQuery.data
  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (assignments ?? [])
      .filter((assignment) => {
        if (statusFilter && assignment.status !== statusFilter) return false
        if (technicianFilter && String(assignment.technician_id) !== technicianFilter) return false
        if (!needle) return true
        const title = reportMap.get(assignment.report_id)?.title ?? ''
        const technician = technicianMap.get(assignment.technician_id)?.name ?? ''
        return title.toLowerCase().includes(needle) || technician.toLowerCase().includes(needle)
      })
      .sort((a, b) => b.assigned_at.localeCompare(a.assigned_at) || b.id - a.id)
  }, [assignments, search, statusFilter, technicianFilter, reportMap, technicianMap])

  const hasFilters = search.trim() !== '' || statusFilter !== '' || technicianFilter !== ''
  const clearFilters = () => {
    setSearch('')
    setStatusFilter('')
    setTechnicianFilter('')
  }

  const newAssignmentButton = (
    <Button onClick={() => setFormTarget({ assignment: null, presetReportId: null })}>
      <Plus className="size-[18px]" aria-hidden="true" />
      New Assignment
    </Button>
  )

  async function confirmDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    try {
      await deleteAssignment.mutateAsync(target.id)
      toast.success('Assignment deleted', {
        description: `${formatReportId(target.report_id)} is Open again`,
      })
    } catch (error) {
      if (!(error instanceof ApiError)) throw error
      toast.error('Could not delete the assignment', { description: error.message })
    } finally {
      setDeleteTarget(null)
      setViewTarget(null)
    }
  }

  const loading = assignmentsQuery.isPending || reportsQuery.isPending || techniciansQuery.isPending
  const loadError = assignmentsQuery.error ?? reportsQuery.error ?? techniciansQuery.error

  return (
    <>
      <PageHeader
        title="Assignments"
        description="Assign technicians to open reports and follow the repair work."
        actions={newAssignmentButton}
      />

      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
        <div className="relative md:max-w-[420px] md:min-w-[260px] md:flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="Search assignments by report or technician"
            placeholder="Search report or technician"
            className="bg-card pl-10"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <NativeSelect
          aria-label="Filter by status"
          wrapperClassName="md:w-48"
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
        <NativeSelect
          aria-label="Filter by technician"
          wrapperClassName="md:w-52"
          value={technicianFilter}
          onChange={(event) => setTechnicianFilter(event.target.value)}
        >
          <option value="">Technician: All</option>
          {(techniciansQuery.data ?? []).map((technician) => (
            <option key={technician.id} value={technician.id}>
              {technician.name}
            </option>
          ))}
        </NativeSelect>
      </div>

      {loading ? (
        <div role="status" aria-label="Loading assignments" className="flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-[68px] rounded-xl" />
          ))}
        </div>
      ) : loadError ? (
        <ErrorState
          title="Could not load assignments"
          message={loadError.message}
          onRetry={() => {
            void assignmentsQuery.refetch()
            void reportsQuery.refetch()
            void techniciansQuery.refetch()
          }}
        />
      ) : assignments && assignments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assignments yet"
          description="Assign a technician to an open report to start the repair."
          actions={newAssignmentButton}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No assignments match your search"
          description="Check the spelling, or clear your search and filters to see every assignment."
          actions={
            <Button variant="secondary" onClick={clearFilters}>
              <X className="size-4" aria-hidden="true" />
              Clear search and filters
            </Button>
          }
        />
      ) : (
        <>
          <AssignmentsList
            assignments={visible}
            reports={reportMap}
            technicians={technicianMap}
            onView={setViewTarget}
            onEdit={(assignment) => setFormTarget({ assignment, presetReportId: null })}
            onDelete={setDeleteTarget}
          />
          <p className="text-[13px] text-muted-foreground" aria-live="polite">
            {hasFilters
              ? `Showing ${visible.length} of ${pluralize(assignments?.length ?? 0, 'assignment')}`
              : pluralize(visible.length, 'assignment')}
          </p>
        </>
      )}

      <AssignmentDetailSheet
        assignment={viewTarget}
        report={viewTarget ? reportMap.get(viewTarget.report_id) : undefined}
        technician={viewTarget ? technicianMap.get(viewTarget.technician_id) : undefined}
        onOpenChange={(open) => {
          if (!open) setViewTarget(null)
        }}
        onEdit={(assignment) => {
          setViewTarget(null)
          setFormTarget({ assignment, presetReportId: null })
        }}
        onDelete={setDeleteTarget}
      />

      <AssignmentFormSheet
        target={formTarget}
        onOpenChange={(open) => {
          if (!open) setFormTarget(null)
        }}
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete this assignment?"
        description={
          deleteTarget
            ? `The assignment for ${reportMap.get(deleteTarget.report_id)?.title ?? formatReportId(deleteTarget.report_id)} will be removed and the report returns to Open so it can be assigned again.`
            : ''
        }
        pending={deleteAssignment.isPending}
        confirmLabel="Delete assignment"
        onConfirm={() => void confirmDelete()}
      />
    </>
  )
}
