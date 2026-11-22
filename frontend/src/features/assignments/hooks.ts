import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createAssignment,
  deleteAssignment,
  getAssignment,
  listAssignments,
  updateAssignment,
} from '@/features/assignments/api'
import type {
  AssignmentCreatePayload,
  AssignmentFilters,
  AssignmentUpdatePayload,
} from '@/features/assignments/types'
import { reportKeys } from '@/features/reports/hooks'

export const assignmentKeys = {
  all: ['assignments'] as const,
  list: (filters: AssignmentFilters) => [...assignmentKeys.all, 'list', filters] as const,
  detail: (id: number) => [...assignmentKeys.all, 'detail', id] as const,
}

export function useAssignments(filters: AssignmentFilters = {}) {
  return useQuery({
    queryKey: assignmentKeys.list(filters),
    queryFn: () => listAssignments(filters),
  })
}

export function useAssignment(id: number | null) {
  return useQuery({
    queryKey: assignmentKeys.detail(id ?? 0),
    queryFn: () => getAssignment(id as number),
    enabled: id !== null,
    retry: false,
  })
}

// An assignment mutation also changes its Report, so both caches are refreshed together.
// Technician workload and the dashboards are derived from these two lists.
function useInvalidateAssignmentsAndReports() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all }),
      queryClient.invalidateQueries({ queryKey: reportKeys.all }),
    ])
}

export function useCreateAssignment() {
  const invalidate = useInvalidateAssignmentsAndReports()
  return useMutation({
    mutationFn: (payload: AssignmentCreatePayload) => createAssignment(payload),
    onSettled: invalidate,
  })
}

export function useUpdateAssignment() {
  const invalidate = useInvalidateAssignmentsAndReports()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AssignmentUpdatePayload }) =>
      updateAssignment(id, payload),
    onSettled: invalidate,
  })
}

export function useDeleteAssignment() {
  const invalidate = useInvalidateAssignmentsAndReports()
  return useMutation({
    mutationFn: (id: number) => deleteAssignment(id),
    onSettled: invalidate,
  })
}
