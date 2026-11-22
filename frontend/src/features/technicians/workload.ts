import type { Assignment } from '@/features/assignments/types'

export type Workload = { active: number; total: number }

/** Active = Assigned or In Progress. Total includes Completed history. */
export function workloadByTechnician(assignments: Assignment[]): Map<number, Workload> {
  const result = new Map<number, Workload>()
  for (const assignment of assignments) {
    const current = result.get(assignment.technician_id) ?? { active: 0, total: 0 }
    current.total += 1
    if (assignment.status !== 'Completed') current.active += 1
    result.set(assignment.technician_id, current)
  }
  return result
}
