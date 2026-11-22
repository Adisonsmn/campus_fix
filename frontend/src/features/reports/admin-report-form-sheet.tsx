import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useMediaQuery } from '@/hooks/use-media-query'
import { formatReportId } from '@/lib/format'
import type { Facility } from '@/features/facilities/types'
import { ReportFormFields } from '@/features/reports/report-form-fields'
import type { Report } from '@/features/reports/types'
import { useReportForm } from '@/features/reports/use-report-form'

type AdminReportFormSheetProps = {
  /** The Open report being edited, or `null` when the sheet is closed. */
  report: Report | null
  facilities: Facility[]
  onOpenChange: (open: boolean) => void
}

export function AdminReportFormSheet({
  report,
  facilities,
  onOpenChange,
}: AdminReportFormSheetProps) {
  const isTabletUp = useMediaQuery('(min-width: 48rem)')

  return (
    <Sheet open={report !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side={isTabletUp ? 'right' : 'bottom'}
        className="gap-0"
        closeLabel="Close form"
      >
        {report ? (
          <ReportForm
            key={report.id}
            report={report}
            facilities={facilities}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function ReportForm({
  report,
  facilities,
  onDone,
}: {
  report: Report
  facilities: Facility[]
  onDone: () => void
}) {
  const { form, submit, serverError, invalidFields } = useReportForm({
    report,
    reporterName: report.reporter_name,
    onSaved: (saved) => {
      toast.success('Report updated', {
        description: `${formatReportId(saved.id)} · ${saved.title}`,
      })
      onDone()
    },
  })
  const { isSubmitting } = form.formState

  return (
    <form noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <SheetHeader>
        <SheetTitle>Edit report {formatReportId(report.id)}</SheetTitle>
        <SheetDescription>
          Only Open reports can be edited. Fields marked * are required.
        </SheetDescription>
      </SheetHeader>

      <SheetBody className="flex flex-col gap-5 py-4">
        <ReportFormFields
          form={form}
          facilities={facilities}
          serverError={serverError}
          invalidFields={invalidFields}
          idPrefix="admin-report"
        />
      </SheetBody>

      <SheetFooter>
        <SheetClose asChild>
          <Button variant="secondary" disabled={isSubmitting}>
            Cancel
          </Button>
        </SheetClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
      </SheetFooter>
    </form>
  )
}
