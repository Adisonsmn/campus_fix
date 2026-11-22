import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { ApiError } from '@/lib/api-client'
import { useCreateReport, useUpdateReport } from '@/features/reports/hooks'
import {
  REPORT_FIELD_LABELS,
  reportDefaults,
  reportFormSchema,
  toReportPayload,
  type ReportFormValues,
} from '@/features/reports/schema'
import type { Report } from '@/features/reports/types'

type Options = {
  /** `null` creates a new report. */
  report: Report | null
  reporterName: string
  onSaved: (saved: Report) => void
}

/** Form state and submit logic shared by the report page and the admin sheet. */
export function useReportForm({ report, reporterName, onSaved }: Options) {
  const createReport = useCreateReport()
  const updateReport = useUpdateReport()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: reportDefaults(report, reporterName),
  })

  const submit = form.handleSubmit(async (values) => {
    setServerError(null)
    const payload = toReportPayload(values)
    try {
      const saved = report
        ? await updateReport.mutateAsync({ id: report.id, payload })
        : await createReport.mutateAsync(payload)
      onSaved(saved)
    } catch (error) {
      if (!(error instanceof ApiError)) throw error
      for (const [field, message] of Object.entries(error.fieldErrors)) {
        if (field in REPORT_FIELD_LABELS) {
          form.setError(field as keyof ReportFormValues, { type: 'server', message })
        }
      }
      setServerError(error.message)
    }
  })

  const invalidFields = Object.keys(form.formState.errors) as (keyof ReportFormValues)[]

  return { form, submit, serverError, invalidFields }
}
