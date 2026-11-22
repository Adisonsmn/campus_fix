import { EntityActionsMenu } from '@/components/shared/entity-actions-menu'
import { EntityCard } from '@/components/shared/entity-card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { pluralize } from '@/lib/format'
import type { Facility } from '@/features/facilities/types'

type FacilitiesListProps = {
  facilities: Facility[]
  /** Reports per facility id; `null` while unknown (still loading or failed). */
  reportCounts: Map<number, number> | null
  onView: (facility: Facility) => void
  onEdit: (facility: Facility) => void
  onDelete: (facility: Facility) => void
}

function location(facility: Facility) {
  return [facility.building, facility.floor].filter(Boolean).join(' · ')
}

function TypePill({ type }: { type: string }) {
  return (
    <span className="inline-flex h-6 items-center rounded-full bg-canvas px-2.5 text-[13px] font-semibold">
      {type}
    </span>
  )
}

export function FacilitiesList({
  facilities,
  reportCounts,
  onView,
  onEdit,
  onDelete,
}: FacilitiesListProps) {
  const countFor = (facility: Facility) =>
    reportCounts?.get(facility.id) ?? (reportCounts ? 0 : null)

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Facility</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Reports</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {facilities.map((facility) => {
              const count = countFor(facility)
              return (
                <TableRow key={facility.id}>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => onView(facility)}
                      className="cursor-pointer text-left font-semibold hover:underline"
                    >
                      {facility.name}
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{location(facility)}</TableCell>
                  <TableCell>
                    <TypePill type={facility.type} />
                  </TableCell>
                  <TableCell className="tabular-nums">{count ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <EntityActionsMenu
                        entityName={facility.name}
                        onView={() => onView(facility)}
                        onEdit={() => onEdit(facility)}
                        onDelete={() => onDelete(facility)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {facilities.map((facility) => {
          const count = countFor(facility)
          return (
            <li key={facility.id}>
              <EntityCard
                title={
                  <button
                    type="button"
                    onClick={() => onView(facility)}
                    className="cursor-pointer text-left hover:underline"
                  >
                    {facility.name}
                  </button>
                }
                subtitle={location(facility)}
                actions={
                  <EntityActionsMenu
                    entityName={facility.name}
                    onView={() => onView(facility)}
                    onEdit={() => onEdit(facility)}
                    onDelete={() => onDelete(facility)}
                  />
                }
              >
                <div className="flex items-center justify-between gap-3">
                  <TypePill type={facility.type} />
                  <span className="text-[13px] text-muted-foreground">
                    {count === null ? 'Reports unavailable' : pluralize(count, 'report')}
                  </span>
                </div>
              </EntityCard>
            </li>
          )
        })}
      </ul>
    </>
  )
}
