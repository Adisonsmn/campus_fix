export const ASSIGNMENT_STATUSES = ['Assigned', 'In Progress', 'Completed'] as const
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number]

export type Assignment = {
  id: number
  report_id: number
  technician_id: number
  status: AssignmentStatus
  instructions: string | null
  repair_notes: string | null
  assigned_at: string
  updated_at: string
}

export type AssignmentFilters = {
  status?: AssignmentStatus
  technician_id?: number
  report_id?: number
}

export type AssignmentCreatePayload = {
  report_id: number
  technician_id: number
  instructions: string | null
}

/**
 * Partial update: send only the fields being changed. `report_id` is immutable and a
 * `status` is only ever the next lifecycle step.
 */
export type AssignmentUpdatePayload = {
  technician_id?: number
  instructions?: string | null
  status?: AssignmentStatus
  repair_notes?: string | null
}
