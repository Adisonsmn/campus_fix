import { apiRequest } from '@/lib/api-client'
import type { Report, ReportFilters } from '@/features/reports/types'

export function listReports(filters: ReportFilters = {}) {
  return apiRequest<Report[]>('/reports', { query: { ...filters } })
}
