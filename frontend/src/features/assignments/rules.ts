import type { Assignment } from '@/features/assignments/types'

/**
 * Technician, instructions and deletion are only open while the work is Assigned.
 * The backend enforces the same rule; this only decides which actions to offer.
 */
export function isAssignmentEditable(assignment: Assignment) {
  return assignment.status === 'Assigned'
}
