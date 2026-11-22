import { useQuery } from '@tanstack/react-query'

import { listReports } from '@/features/reports/api'
import type { ReportFilters } from '@/features/reports/types'

export const reportKeys = {
  all: ['reports'] as const,
  list: (filters: ReportFilters) => [...reportKeys.all, 'list', filters] as const,
}

export function useReports(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: reportKeys.list(filters),
    queryFn: () => listReports(filters),
  })
}
