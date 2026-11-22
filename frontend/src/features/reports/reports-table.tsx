import { EntityActionsMenu } from '@/components/shared/entity-actions-menu'
import { EntityCard } from '@/components/shared/entity-card'
import { StatusBadge } from '@/components/shared/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate, formatReportId } from '@/lib/format'
import type { Facility } from '@/features/facilities/types'
import { PriorityLabel } from '@/features/reports/priority-label'
import { isReportEditable } from '@/features/reports/rules'
import type { Report } from '@/features/reports/types'

type ReportsTableProps = {
  reports: Report[]
  facilities: Map<number, Facility>
  /** Admin lists also show priority and reporter. */
  showReporter?: boolean
  onView: (report: Report) => void
  onAssign?: (report: Report) => void
  onEdit: (report: Report) => void
  onDelete: (report: Report) => void
}

export function ReportsTable({
  reports,
  facilities,
  showReporter = false,
  onView,
  onAssign,
  onEdit,
  onDelete,
}: ReportsTableProps) {
  const actionsFor = (report: Report) => {
    const editable = isReportEditable(report)
    return (
      <EntityActionsMenu
        entityName={report.title}
        onView={() => onView(report)}
        onAssign={editable && onAssign ? () => onAssign(report) : undefined}
        onEdit={editable ? () => onEdit(report) : undefined}
        onDelete={editable ? () => onDelete(report) : undefined}
      />
    )
  }

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Report ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Facility</TableHead>
              {showReporter ? <TableHead>Priority</TableHead> : null}
              {showReporter ? <TableHead>Reporter</TableHead> : null}
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => {
              const facility = facilities.get(report.facility_id)
              return (
                <TableRow key={report.id}>
                  <TableCell className="font-semibold whitespace-nowrap">
                    {formatReportId(report.id)}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => onView(report)}
                      className="cursor-pointer text-left font-semibold hover:underline"
                    >
                      {report.title}
                    </button>
                  </TableCell>
                  <TableCell>
                    <p>{facility?.name ?? 'Unknown facility'}</p>
                    {facility ? (
                      <p className="text-[13px] text-muted-foreground">{facility.building}</p>
                    ) : null}
                  </TableCell>
                  {showReporter ? (
                    <TableCell>
                      <PriorityLabel priority={report.priority} />
                    </TableCell>
                  ) : null}
                  {showReporter ? <TableCell>{report.reporter_name}</TableCell> : null}
                  <TableCell className="whitespace-nowrap">
                    {formatDate(report.created_at)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={report.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">{actionsFor(report)}</div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {reports.map((report) => {
          const facility = facilities.get(report.facility_id)
          return (
            <li key={report.id}>
              <EntityCard
                title={
                  <button
                    type="button"
                    onClick={() => onView(report)}
                    className="cursor-pointer text-left hover:underline"
                  >
                    {report.title}
                  </button>
                }
                subtitle={`${formatReportId(report.id)} · ${facility?.name ?? 'Unknown facility'}`}
                actions={actionsFor(report)}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StatusBadge status={report.status} />
                  <span className="text-[13px] text-muted-foreground">
                    {showReporter ? `${report.reporter_name} · ` : ''}
                    {formatDate(report.created_at)}
                  </span>
                </div>
                {showReporter ? <PriorityLabel priority={report.priority} /> : null}
              </EntityCard>
            </li>
          )
        })}
      </ul>
    </>
  )
}
