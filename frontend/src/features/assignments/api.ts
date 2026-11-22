import { apiRequest } from '@/lib/api-client'
import type {
  Assignment,
  AssignmentCreatePayload,
  AssignmentFilters,
  AssignmentUpdatePayload,
} from '@/features/assignments/types'

export function listAssignments(filters: AssignmentFilters = {}) {
  return apiRequest<Assignment[]>('/assignments', { query: { ...filters } })
}

export function getAssignment(id: number) {
  return apiRequest<Assignment>(`/assignments/${id}`)
}

export function createAssignment(payload: AssignmentCreatePayload) {
  return apiRequest<Assignment>('/assignments', { method: 'POST', body: payload })
}

export function updateAssignment(id: number, payload: AssignmentUpdatePayload) {
  return apiRequest<Assignment>(`/assignments/${id}`, { method: 'PUT', body: payload })
}

export function deleteAssignment(id: number) {
  return apiRequest<void>(`/assignments/${id}`, { method: 'DELETE' })
}
