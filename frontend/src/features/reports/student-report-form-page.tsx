import { ArrowRight, Flag, MapPin, Pencil } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Breadcrumb } from '@/components/shared/breadcrumb'
import { ErrorState } from '@/components/shared/error-state'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatReportId, parseRouteId } from '@/lib/format'
import { useFacilities } from '@/features/facilities/hooks'
import { useReport } from '@/features/reports/hooks'
import { ReportFormFields } from '@/features/reports/report-form-fields'
import { isReportEditable } from '@/features/reports/rules'
import type { Report } from '@/features/reports/types'
import { useReportForm } from '@/features/reports/use-report-form'
import type { Facility } from '@/features/facilities/types'
import { ROLES } from '@/features/roles/roles'

const REPORTS_PATH = '/student/reports'

const TIPS = [
  {
    icon: Pencil,
    title: 'Be specific',
    text: 'Say what is broken and what it does, e.g. “AC runs but does not cool”.',
  },
  {
    icon: MapPin,
    title: 'Name the place',
    text: 'Pick the facility, then mention the room, desk or door.',
  },
  {
    icon: Flag,
    title: 'Choose priority honestly',
    text: 'High is for safety risks or anything that blocks a class.',
  },
]

/** Create Report (`reports/new`) and Edit Report (`reports/:id/edit`). */
export function StudentReportFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const facilitiesQuery = useFacilities()
  const { id } = useParams()
  const reportId = mode === 'edit' ? parseRouteId(id) : null
  const reportQuery = useReport(reportId)

  if (mode === 'edit' && reportId === null) {
    return <NotFound message="This report link is not valid." />
  }

  if (facilitiesQuery.isError) {
    return (
      <ErrorState
        title="Could not load facilities"
        message={facilitiesQuery.error.message}
        onRetry={() => void facilitiesQuery.refetch()}
      />
    )
  }
  if (mode === 'edit' && reportQuery.isError) {
    return <NotFound message={reportQuery.error.message} />
  }
  if (facilitiesQuery.isPending || (mode === 'edit' && reportQuery.isPending)) {
    return (
      <div role="status" aria-label="Loading form" className="flex flex-col gap-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-[420px] rounded-xl" />
      </div>
    )
  }

  const report = mode === 'edit' ? (reportQuery.data ?? null) : null
  if (report && !isReportEditable(report)) {
    return (
      <>
        <Breadcrumb
          parents={[
            { label: 'My Reports', to: REPORTS_PATH },
            { label: formatReportId(report.id), to: `${REPORTS_PATH}/${report.id}` },
          ]}
          current="Edit"
        />
        <ErrorState
          title="This report can no longer be edited"
          message={`Reports can only be edited while they are Open. ${formatReportId(report.id)} is ${report.status}.`}
        />
        <Button asChild variant="secondary" className="self-start">
          <Link to={`${REPORTS_PATH}/${report.id}`}>Back to report</Link>
        </Button>
      </>
    )
  }

  return (
    <ReportFormView key={report?.id ?? 'new'} report={report} facilities={facilitiesQuery.data} />
  )
}

function NotFound({ message }: { message: string }) {
  return (
    <>
      <ErrorState title="Report not found" message={message} />
      <Button asChild variant="secondary" className="self-start">
        <Link to={REPORTS_PATH}>Back to My Reports</Link>
      </Button>
    </>
  )
}

function ReportFormView({ report, facilities }: { report: Report | null; facilities: Facility[] }) {
  const navigate = useNavigate()
  const isEdit = report !== null
  const { form, submit, serverError, invalidFields } = useReportForm({
    report,
    reporterName: ROLES.student.persona.name,
    onSaved: (saved) => {
      toast.success(isEdit ? 'Report updated' : 'Report submitted', {
        description: `${formatReportId(saved.id)} · ${saved.title}`,
      })
      void navigate(`${REPORTS_PATH}/${saved.id}`)
    },
  })
  const { isSubmitting } = form.formState
  const cancelTo = report ? `${REPORTS_PATH}/${report.id}` : REPORTS_PATH

  return (
    <>
      <div className="flex flex-col gap-3">
        <Breadcrumb
          parents={[
            { label: 'My Reports', to: REPORTS_PATH },
            ...(report
              ? [{ label: formatReportId(report.id), to: `${REPORTS_PATH}/${report.id}` }]
              : []),
          ]}
          current={isEdit ? 'Edit' : 'Create Report'}
        />
        <PageHeader
          title={isEdit ? 'Edit Report' : 'Report a Facility Issue'}
          description={
            isEdit
              ? 'Update the details while the report is still Open. Fields marked * are required.'
              : 'Tell us what is broken and where. Fields marked * are required.'
          }
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form noValidate onSubmit={submit} className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-5 rounded-xl border bg-card p-4 shadow-card md:p-6">
            <ReportFormFields
              form={form}
              facilities={facilities}
              serverError={serverError}
              invalidFields={invalidFields}
              idPrefix="report"
              reporterHint="Demo mode: this name appears on the report."
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-card">
            <p className="text-[13px] text-muted-foreground">* Required field</p>
            <div className="flex gap-3 max-md:w-full max-md:flex-col-reverse max-md:*:w-full">
              <Button asChild variant="secondary" disabled={isSubmitting}>
                <Link to={cancelTo}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  'Saving…'
                ) : (
                  <>
                    {isEdit ? 'Save changes' : 'Submit report'}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        <aside
          aria-labelledby="tips-heading"
          className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-card md:p-6"
        >
          <h2 id="tips-heading" className="text-base font-bold">
            What makes a useful report
          </h2>
          <ul className="flex flex-col gap-4">
            {TIPS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ice">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-[13px] text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  )
}
