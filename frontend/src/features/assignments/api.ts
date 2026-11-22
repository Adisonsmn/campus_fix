import { apiRequest } from '@/lib/api-client'
import type { Assignment, AssignmentFilters } from '@/features/assignments/types'

export function listAssignments(filters: AssignmentFilters = {}) {
  return apiRequest<Assignment[]>('/assignments', { query: { ...filters } })
}
