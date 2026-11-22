import { useMemo, useState } from 'react'
import { Building2, Plus, Search, SearchX, X } from 'lucide-react'
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
import { FacilitiesList } from '@/features/facilities/facilities-list'
import { FacilityDetailSheet } from '@/features/facilities/facility-detail-sheet'
import { FacilityFormSheet } from '@/features/facilities/facility-form-sheet'
import { useDeleteFacility, useFacilities } from '@/features/facilities/hooks'
import { FACILITY_TYPES, type Facility } from '@/features/facilities/types'
import { useReports } from '@/features/reports/hooks'

type FormTarget = { facility: Facility | null }

export function FacilitiesPage() {
  const facilitiesQuery = useFacilities()
  const reportsQuery = useReports()
  const deleteFacility = useDeleteFacility()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null)
  const [viewTarget, setViewTarget] = useState<Facility | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Facility | null>(null)

  const facilities = facilitiesQuery.data
  const reportCounts = useMemo(() => {
    if (!reportsQuery.data) return null
    const counts = new Map<number, number>()
    for (const report of reportsQuery.data) {
      counts.set(report.facility_id, (counts.get(report.facility_id) ?? 0) + 1)
    }
    return counts
  }, [reportsQuery.data])

  const typeOptions = useMemo(() => {
    const extra = (facilities ?? [])
      .map((f) => f.type)
      .filter((t) => !FACILITY_TYPES.some((x) => x === t))
    return [...FACILITY_TYPES, ...new Set(extra)]
  }, [facilities])

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (facilities ?? []).filter((facility) => {
      if (typeFilter && facility.type !== typeFilter) return false
      if (!needle) return true
      return (
        facility.name.toLowerCase().includes(needle) ||
        facility.building.toLowerCase().includes(needle)
      )
    })
  }, [facilities, search, typeFilter])

  const hasFilters = search.trim() !== '' || typeFilter !== ''
  const clearFilters = () => {
    setSearch('')
    setTypeFilter('')
  }

  const deleteCount = deleteTarget ? (reportCounts?.get(deleteTarget.id) ?? 0) : 0

  async function confirmDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    try {
      await deleteFacility.mutateAsync(target.id)
      toast.success('Facility deleted', { description: target.name })
    } catch (error) {
      if (!(error instanceof ApiError)) throw error
      toast.error('Could not delete the facility', { description: error.message })
    } finally {
      setDeleteTarget(null)
      setViewTarget(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Facilities"
        description="Manage campus facilities and see the reports linked to each one."
        actions={
          <Button onClick={() => setFormTarget({ facility: null })}>
            <Plus className="size-[18px]" aria-hidden="true" />
            New Facility
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
            aria-label="Search facilities by name or building"
            placeholder="Search by name or building"
            className="bg-card pl-10"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <NativeSelect
          aria-label="Filter by type"
          wrapperClassName="md:w-52"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        >
          <option value="">Type: All</option>
          {typeOptions.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </NativeSelect>
      </div>

      {facilitiesQuery.isPending ? (
        <div role="status" aria-label="Loading facilities" className="flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-[68px] rounded-xl" />
          ))}
        </div>
      ) : facilitiesQuery.isError ? (
        <ErrorState
          title="Could not load facilities"
          message={facilitiesQuery.error.message}
          onRetry={() => void facilitiesQuery.refetch()}
        />
      ) : facilities && facilities.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No facilities yet"
          description="Add the first campus facility so students can report issues against it."
          actions={
            <Button onClick={() => setFormTarget({ facility: null })}>
              <Plus className="size-[18px]" aria-hidden="true" />
              New Facility
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No facilities match your search"
          description="Check the spelling, or clear your search and filter to see every facility."
          actions={
            <Button variant="secondary" onClick={clearFilters}>
              <X className="size-4" aria-hidden="true" />
              Clear search and filter
            </Button>
          }
        />
      ) : (
        <>
          <FacilitiesList
            facilities={visible}
            reportCounts={reportCounts}
            onView={setViewTarget}
            onEdit={(facility) => setFormTarget({ facility })}
            onDelete={setDeleteTarget}
          />
          <p className="text-[13px] text-muted-foreground" aria-live="polite">
            {hasFilters
              ? `Showing ${visible.length} of ${pluralize(facilities?.length ?? 0, 'facility', 'facilities')}`
              : `${pluralize(visible.length, 'facility', 'facilities')}`}
          </p>
        </>
      )}

      <FacilityFormSheet
        open={formTarget !== null}
        onOpenChange={(open) => {
          if (!open) setFormTarget(null)
        }}
        facility={formTarget?.facility ?? null}
      />

      <FacilityDetailSheet
        facility={viewTarget}
        onOpenChange={(open) => {
          if (!open) setViewTarget(null)
        }}
        onEdit={(facility) => {
          setViewTarget(null)
          setFormTarget({ facility })
        }}
        onDelete={setDeleteTarget}
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={deleteTarget ? `Delete facility “${deleteTarget.name}”?` : 'Delete facility?'}
        description={
          deleteTarget
            ? `${deleteTarget.name} in ${deleteTarget.building} will be permanently removed. This cannot be undone.`
            : ''
        }
        blockedReason={
          deleteCount > 0
            ? `This facility is used by ${pluralize(deleteCount, 'report')}, so it cannot be deleted. Facilities with linked reports are protected.`
            : undefined
        }
        pending={deleteFacility.isPending}
        confirmLabel="Delete facility"
        onConfirm={() => void confirmDelete()}
      />
    </>
  )
}
