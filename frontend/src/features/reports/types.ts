export const REPORT_STATUSES = ['Open', 'Assigned', 'In Progress', 'Resolved'] as const
export type ReportStatus = (typeof REPORT_STATUSES)[number]

export const PRIORITIES = ['Low', 'Medium', 'High'] as const
export type Priority = (typeof PRIORITIES)[number]

export type Report = {
  id: number
  title: string
  description: string
  facility_id: number
  reporter_name: string
  priority: Priority
  status: ReportStatus
  created_at: string
  updated_at: string
}

/** Body for create and update. The server controls `id`, `status` and timestamps. */
export type ReportPayload = Pick<
  Report,
  'title' | 'description' | 'facility_id' | 'reporter_name' | 'priority'
>

export type ReportFilters = {
  q?: string
  status?: ReportStatus
  facility_id?: number
  priority?: Priority
  reporter_name?: string
}
