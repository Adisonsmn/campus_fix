import { Pencil, Trash2 } from 'lucide-react'

import { ErrorState } from '@/components/shared/error-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useMediaQuery } from '@/hooks/use-media-query'
import { formatDate, formatReportId, pluralize } from '@/lib/format'
import { useReports } from '@/features/reports/hooks'
import type { Facility } from '@/features/facilities/types'

type FacilityDetailSheetProps = {
  facility: Facility | null
  onOpenChange: (open: boolean) => void
  onEdit: (facility: Facility) => void
  onDelete: (facility: Facility) => void
}

export function FacilityDetailSheet({
  facility,
  onOpenChange,
  onEdit,
  onDelete,
}: FacilityDetailSheetProps) {
  const isTabletUp = useMediaQuery('(min-width: 48rem)')

  return (
    <Sheet open={facility !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side={isTabletUp ? 'right' : 'bottom'}
        className="gap-0"
        closeLabel="Close details"
      >
        {facility ? (
          <>
            <SheetHeader>
              <SheetTitle>{facility.name}</SheetTitle>
              <SheetDescription>Facility details and linked reports.</SheetDescription>
            </SheetHeader>

            <SheetBody className="flex flex-col gap-6 py-4">
              <dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-2">
                <Detail label="Building" value={facility.building} />
                <Detail label="Floor" value={facility.floor} />
                <Detail label="Type" value={facility.type} />
                <Detail label="Description" value={facility.description} />
              </dl>
              <RelatedReports facilityId={facility.id} />
            </SheetBody>

            <SheetFooter>
              <Button variant="secondary" onClick={() => onDelete(facility)}>
                <Trash2 className="size-4" aria-hidden="true" />
                Delete
              </Button>
              <Button onClick={() => onEdit(facility)}>
                <Pencil className="size-4" aria-hidden="true" />
                Edit
              </Button>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <>
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="m-0 font-semibold break-words">{value || '—'}</dd>
    </>
  )
}

function RelatedReports({ facilityId }: { facilityId: number }) {
  const reports = useReports({ facility_id: facilityId })

  return (
    <section aria-labelledby="related-reports-heading" className="flex flex-col gap-3">
      <h3 id="related-reports-heading" className="text-base font-bold">
        Related reports
        {reports.data ? (
          <span className="ml-2 text-[13px] font-semibold text-muted-foreground">
            {pluralize(reports.data.length, 'report')}
          </span>
        ) : null}
      </h3>

      {reports.isPending ? (
        <div className="flex flex-col gap-3" role="status" aria-label="Loading related reports">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      ) : reports.isError ? (
        <ErrorState
          compact
          title="Could not load reports"
          message={reports.error.message}
          onRetry={() => void reports.refetch()}
        />
      ) : reports.data.length === 0 ? (
        <p className="text-muted-foreground">No reports have been filed for this facility.</p>
      ) : (
        <ul className="flex flex-col">
          {reports.data.map((report) => (
            <li
              key={report.id}
              className="flex flex-col gap-1.5 border-t py-3 first:border-t-0 first:pt-0"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold">{report.title}</p>
                <StatusBadge status={report.status} />
              </div>
              <p className="text-[13px] text-muted-foreground">
                {formatReportId(report.id)} · {report.reporter_name} ·{' '}
                {formatDate(report.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
