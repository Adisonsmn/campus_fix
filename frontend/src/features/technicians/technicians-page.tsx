import { useMemo, useState } from 'react'
import { Plus, Search, SearchX, UserCog, X } from 'lucide-react'
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
import { pluralize } from '@/lib/format'
import { useAssignments } from '@/features/assignments/hooks'
import { TechnicianDetailSheet } from '@/features/technicians/technician-detail-sheet'
import { TechnicianFormSheet } from '@/features/technicians/technician-form-sheet'
import { TechniciansList } from '@/features/technicians/technicians-list'
import { useDeleteTechnician, useTechnicians } from '@/features/technicians/hooks'
import { AVAILABILITY_STATUSES, type Technician } from '@/features/technicians/types'
import { workloadByTechnician } from '@/features/technicians/workload'

type FormTarget = { technician: Technician | null }

export function TechniciansPage() {
  const techniciansQuery = useTechnicians()
  const assignmentsQuery = useAssignments()
  const deleteTechnician = useDeleteTechnician()

  const [search, setSearch] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState('')
  const [specializationFilter, setSpecializationFilter] = useState('')
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null)
  const [viewTarget, setViewTarget] = useState<Technician | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Technician | null>(null)

  const technicians = techniciansQuery.data
  const workloads = useMemo(
    () => (assignmentsQuery.data ? workloadByTechnician(assignmentsQuery.data) : null),
    [assignmentsQuery.data],
  )

  const specializations = useMemo(
    () => [...new Set((technicians ?? []).map((t) => t.specialization))].sort(),
    [technicians],
  )

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (technicians ?? []).filter((technician) => {
      if (availabilityFilter && technician.availability_status !== availabilityFilter) return false
      if (specializationFilter && technician.specialization !== specializationFilter) return false
      if (!needle) return true
      return (
        technician.name.toLowerCase().includes(needle) ||
        technician.email.toLowerCase().includes(needle)
      )
    })
  }, [technicians, search, availabilityFilter, specializationFilter])

  const hasFilters =
    search.trim() !== '' || availabilityFilter !== '' || specializationFilter !== ''
  const clearFilters = () => {
    setSearch('')
    setAvailabilityFilter('')
    setSpecializationFilter('')
  }

  const deleteCount = deleteTarget ? (workloads?.get(deleteTarget.id)?.total ?? 0) : 0

  async function confirmDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    try {
      await deleteTechnician.mutateAsync(target.id)
      toast.success('Technician deleted', { description: target.name })
    } catch (error) {
      if (!(error instanceof ApiError)) throw error
      toast.error('Could not delete the technician', { description: error.message })
    } finally {
      setDeleteTarget(null)
      setViewTarget(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Technicians"
        description="Manage technicians, their availability, and the work assigned to them."
        actions={
          <Button onClick={() => setFormTarget({ technician: null })}>
            <Plus className="size-[18px]" aria-hidden="true" />
            New Technician
          </Button>
        }
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative md:max-w-[420px] md:flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="Search technicians by name or email"
            placeholder="Search by name or email"
            className="bg-card pl-10"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <NativeSelect
          aria-label="Filter by specialization"
          wrapperClassName="md:w-52"
          value={specializationFilter}
          onChange={(event) => setSpecializationFilter(event.target.value)}
        >
          <option value="">Specialization: All</option>
          {specializations.map((specialization) => (
            <option key={specialization} value={specialization}>
              {specialization}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="Filter by availability"
          wrapperClassName="md:w-52"
          value={availabilityFilter}
          onChange={(event) => setAvailabilityFilter(event.target.value)}
        >
          <option value="">Availability: All</option>
          {AVAILABILITY_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </NativeSelect>
      </div>

      {techniciansQuery.isPending ? (
        <div role="status" aria-label="Loading technicians" className="flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-[68px] rounded-xl" />
          ))}
        </div>
      ) : techniciansQuery.isError ? (
        <ErrorState
          title="Could not load technicians"
          message={techniciansQuery.error.message}
          onRetry={() => void techniciansQuery.refetch()}
        />
      ) : technicians && technicians.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No technicians yet"
          description="Add a technician so repair work can be assigned."
          actions={
            <Button onClick={() => setFormTarget({ technician: null })}>
              <Plus className="size-[18px]" aria-hidden="true" />
              New Technician
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No technicians match your search"
          description="Check the spelling, or clear your search and filters to see every technician."
          actions={
            <Button variant="secondary" onClick={clearFilters}>
              <X className="size-4" aria-hidden="true" />
              Clear search and filters
            </Button>
          }
        />
      ) : (
        <>
          <TechniciansList
            technicians={visible}
            workloads={workloads}
            onView={setViewTarget}
            onEdit={(technician) => setFormTarget({ technician })}
            onDelete={setDeleteTarget}
          />
          <p className="text-[13px] text-muted-foreground" aria-live="polite">
            {hasFilters
              ? `Showing ${visible.length} of ${pluralize(technicians?.length ?? 0, 'technician')}`
              : pluralize(visible.length, 'technician')}
          </p>
        </>
      )}

      <TechnicianFormSheet
        open={formTarget !== null}
        onOpenChange={(open) => {
          if (!open) setFormTarget(null)
        }}
        technician={formTarget?.technician ?? null}
      />

      <TechnicianDetailSheet
        technician={viewTarget}
        onOpenChange={(open) => {
          if (!open) setViewTarget(null)
        }}
        onEdit={(technician) => {
          setViewTarget(null)
          setFormTarget({ technician })
        }}
        onDelete={setDeleteTarget}
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={deleteTarget ? `Delete technician “${deleteTarget.name}”?` : 'Delete technician?'}
        description={
          deleteTarget
            ? `${deleteTarget.name} (${deleteTarget.specialization}) will be permanently removed. This cannot be undone.`
            : ''
        }
        blockedReason={
          deleteCount > 0
            ? `This technician has ${pluralize(deleteCount, 'assignment')} on record, so they cannot be deleted. Technicians linked to assignments are protected.`
            : undefined
        }
        pending={deleteTechnician.isPending}
        confirmLabel="Delete technician"
        onConfirm={() => void confirmDelete()}
      />
    </>
  )
}
