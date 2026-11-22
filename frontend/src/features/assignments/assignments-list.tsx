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
import { formatDate, formatReportId } from '@/lib/format'
import { AssignmentStatusBadge } from '@/features/assignments/assignment-status-badge'
import { isAssignmentEditable } from '@/features/assignments/rules'
import type { Assignment } from '@/features/assignments/types'
import type { Report } from '@/features/reports/types'
import type { Technician } from '@/features/technicians/types'

type AssignmentsListProps = {
  assignments: Assignment[]
  reports: Map<number, Report>
  technicians: Map<number, Technician>
  onView: (assignment: Assignment) => void
  onEdit: (assignment: Assignment) => void
  onDelete: (assignment: Assignment) => void
}

export function AssignmentsList({
  assignments,
  reports,
  technicians,
  onView,
  onEdit,
  onDelete,
}: AssignmentsListProps) {
  const titleOf = (assignment: Assignment) =>
    reports.get(assignment.report_id)?.title ?? formatReportId(assignment.report_id)
  const technicianOf = (assignment: Assignment) =>
    technicians.get(assignment.technician_id)?.name ?? `Technician ${assignment.technician_id}`

  const actionsFor = (assignment: Assignment) => {
    const editable = isAssignmentEditable(assignment)
    return (
      <EntityActionsMenu
        entityName={`assignment for ${titleOf(assignment)}`}
        onView={() => onView(assignment)}
        onEdit={editable ? () => onEdit(assignment) : undefined}
        onDelete={editable ? () => onDelete(assignment) : undefined}
      />
    )
  }

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Report</TableHead>
              <TableHead>Technician</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => onView(assignment)}
                    className="cursor-pointer text-left font-semibold hover:underline"
                  >
                    {titleOf(assignment)}
                  </button>
                  <p className="text-[13px] text-muted-foreground">
                    {formatReportId(assignment.report_id)}
                  </p>
                </TableCell>
                <TableCell>
                  <p>{technicianOf(assignment)}</p>
                  <p className="text-[13px] text-muted-foreground">
                    {technicians.get(assignment.technician_id)?.specialization}
                  </p>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDate(assignment.assigned_at)}
                </TableCell>
                <TableCell>
                  <AssignmentStatusBadge status={assignment.status} />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">{actionsFor(assignment)}</div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {assignments.map((assignment) => (
          <li key={assignment.id}>
            <EntityCard
              title={
                <button
                  type="button"
                  onClick={() => onView(assignment)}
                  className="cursor-pointer text-left hover:underline"
                >
                  {titleOf(assignment)}
                </button>
              }
              subtitle={`${formatReportId(assignment.report_id)} · ${technicianOf(assignment)}`}
              actions={actionsFor(assignment)}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <AssignmentStatusBadge status={assignment.status} />
                <span className="text-[13px] text-muted-foreground">
                  Assigned {formatDate(assignment.assigned_at)}
                </span>
              </div>
            </EntityCard>
          </li>
        ))}
      </ul>
    </>
  )
}
