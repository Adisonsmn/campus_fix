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
import { AvailabilityBadge } from '@/features/technicians/availability-badge'
import type { Technician } from '@/features/technicians/types'
import type { Workload } from '@/features/technicians/workload'

type TechniciansListProps = {
  technicians: Technician[]
  /** Workload per technician id; `null` while unknown (still loading or failed). */
  workloads: Map<number, Workload> | null
  onView: (technician: Technician) => void
  onEdit: (technician: Technician) => void
  onDelete: (technician: Technician) => void
}

export function TechniciansList({
  technicians,
  workloads,
  onView,
  onEdit,
  onDelete,
}: TechniciansListProps) {
  const activeFor = (technician: Technician) =>
    workloads ? (workloads.get(technician.id)?.active ?? 0) : null

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Technician</TableHead>
              <TableHead>Specialization</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead>Active work</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {technicians.map((technician) => {
              const active = activeFor(technician)
              return (
                <TableRow key={technician.id}>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => onView(technician)}
                      className="cursor-pointer text-left font-semibold hover:underline"
                    >
                      {technician.name}
                    </button>
                    <p className="text-[13px] text-muted-foreground">{technician.email}</p>
                  </TableCell>
                  <TableCell>{technician.specialization}</TableCell>
                  <TableCell>
                    <AvailabilityBadge status={technician.availability_status} />
                  </TableCell>
                  <TableCell className="tabular-nums">{active ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <EntityActionsMenu
                        entityName={technician.name}
                        onView={() => onView(technician)}
                        onEdit={() => onEdit(technician)}
                        onDelete={() => onDelete(technician)}
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
        {technicians.map((technician) => {
          const active = activeFor(technician)
          return (
            <li key={technician.id}>
              <EntityCard
                title={
                  <button
                    type="button"
                    onClick={() => onView(technician)}
                    className="cursor-pointer text-left hover:underline"
                  >
                    {technician.name}
                  </button>
                }
                subtitle={technician.specialization}
                actions={
                  <EntityActionsMenu
                    entityName={technician.name}
                    onView={() => onView(technician)}
                    onEdit={() => onEdit(technician)}
                    onDelete={() => onDelete(technician)}
                  />
                }
              >
                <div className="flex items-center justify-between gap-3">
                  <AvailabilityBadge status={technician.availability_status} />
                  <span className="text-[13px] text-muted-foreground">
                    {active === null ? 'Workload unavailable' : pluralize(active, 'active task')}
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
