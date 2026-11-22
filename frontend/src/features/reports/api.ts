import { apiRequest } from '@/lib/api-client'
import type { Report, ReportFilters, ReportPayload } from '@/features/reports/types'

export function listReports(filters: ReportFilters = {}) {
  return apiRequest<Report[]>('/reports', { query: { ...filters } })
}

export function getReport(id: number) {
  return apiRequest<Report>(`/reports/${id}`)
}

export function createReport(payload: ReportPayload) {
  return apiRequest<Report>('/reports', { method: 'POST', body: payload })
}

export function updateReport(id: number, payload: ReportPayload) {
  return apiRequest<Report>(`/reports/${id}`, { method: 'PUT', body: payload })
}

export function deleteReport(id: number) {
  return apiRequest<void>(`/reports/${id}`, { method: 'DELETE' })
}
