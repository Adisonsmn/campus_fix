import { z } from 'zod'

import type { Facility } from '@/features/facilities/types'
import type { Report, ReportPayload } from '@/features/reports/types'

// Mirrors the backend rules in docs/api-contract.md. The server stays authoritative.
export const reportFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Enter a title of at least 3 characters.')
    .max(120, 'Use 120 characters or fewer.'),
  facility_id: z.string().min(1, 'Select a facility from the list.'),
  reporter_name: z
    .string()
    .trim()
    .min(2, 'Enter a name of at least 2 characters.')
    .max(100, 'Use 100 characters or fewer.'),
  priority: z.enum(['Low', 'Medium', 'High']),
  description: z
    .string()
    .trim()
    .min(10, 'Describe the problem in at least 10 characters.')
    .max(2000, 'Use 2000 characters or fewer.'),
})

export type ReportFormValues = z.infer<typeof reportFormSchema>

export const DESCRIPTION_LIMIT = 2000

export const REPORT_FIELD_LABELS: Record<keyof ReportFormValues, string> = {
  title: 'Issue title',
  facility_id: 'Facility',
  reporter_name: 'Reporter name',
  priority: 'Priority',
  description: 'Issue description',
}

export function reportDefaults(report: Report | null, reporterName: string): ReportFormValues {
  return {
    title: report?.title ?? '',
    facility_id: report ? String(report.facility_id) : '',
    reporter_name: report?.reporter_name ?? reporterName,
    priority: report?.priority ?? 'Medium',
    description: report?.description ?? '',
  }
}

export function toReportPayload(values: ReportFormValues): ReportPayload {
  return {
    title: values.title,
    facility_id: Number(values.facility_id),
    reporter_name: values.reporter_name,
    priority: values.priority,
    description: values.description,
  }
}

/** "Faculty of Engineering · Floor 2" */
export function facilityLocation(facility: Facility | undefined) {
  if (!facility) return null
  return [facility.building, facility.floor].filter(Boolean).join(' · ')
}
