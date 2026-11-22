import { useQuery } from '@tanstack/react-query'

import { listAssignments } from '@/features/assignments/api'
import type { AssignmentFilters } from '@/features/assignments/types'

export const assignmentKeys = {
  all: ['assignments'] as const,
  list: (filters: AssignmentFilters) => [...assignmentKeys.all, 'list', filters] as const,
}

export function useAssignments(filters: AssignmentFilters = {}) {
  return useQuery({
    queryKey: assignmentKeys.list(filters),
    queryFn: () => listAssignments(filters),
  })
}
