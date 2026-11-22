import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createReport,
  deleteReport,
  getReport,
  listReports,
  updateReport,
} from '@/features/reports/api'
import type { ReportFilters, ReportPayload } from '@/features/reports/types'

export const reportKeys = {
  all: ['reports'] as const,
  list: (filters: ReportFilters) => [...reportKeys.all, 'list', filters] as const,
  detail: (id: number) => [...reportKeys.all, 'detail', id] as const,
}

export function useReports(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: reportKeys.list(filters),
    queryFn: () => listReports(filters),
  })
}

export function useReport(id: number | null) {
  return useQuery({
    queryKey: reportKeys.detail(id ?? 0),
    queryFn: () => getReport(id as number),
    enabled: id !== null,
    retry: false,
  })
}

// Every report list, detail and facility report count shares the `reports` key prefix.
function useInvalidateReports() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: reportKeys.all })
}

export function useCreateReport() {
  const invalidate = useInvalidateReports()
  return useMutation({
    mutationFn: (payload: ReportPayload) => createReport(payload),
    onSettled: invalidate,
  })
}

export function useUpdateReport() {
  const invalidate = useInvalidateReports()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ReportPayload }) =>
      updateReport(id, payload),
    onSettled: invalidate,
  })
}

export function useDeleteReport() {
  const invalidate = useInvalidateReports()
  return useMutation({
    mutationFn: (id: number) => deleteReport(id),
    onSettled: invalidate,
  })
}
