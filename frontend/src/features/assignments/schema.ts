import { z } from 'zod'

import type { Assignment } from '@/features/assignments/types'

// Mirrors the backend rules in docs/api-contract.md. The server stays authoritative.
export const assignmentFormSchema = z.object({
  report_id: z.string().min(1, 'Select a report to assign.'),
  technician_id: z.string().min(1, 'Select a technician.'),
  instructions: z.string().trim().max(1000, 'Use 1000 characters or fewer.'),
})

export type AssignmentFormValues = z.infer<typeof assignmentFormSchema>

export const INSTRUCTIONS_LIMIT = 1000

export const ASSIGNMENT_FIELD_LABELS: Record<keyof AssignmentFormValues, string> = {
  report_id: 'Report',
  technician_id: 'Technician',
  instructions: 'Instructions',
}

export function assignmentDefaults(
  assignment: Assignment | null,
  presetReportId: number | null,
): AssignmentFormValues {
  return {
    report_id: String(assignment?.report_id ?? presetReportId ?? ''),
    technician_id: assignment ? String(assignment.technician_id) : '',
    instructions: assignment?.instructions ?? '',
  }
}

// Repair notes are written by the technician, never in the admin form.
export const repairNotesFormSchema = z.object({
  repair_notes: z.string().trim().max(2000, 'Use 2000 characters or fewer.'),
})

export type RepairNotesFormValues = z.infer<typeof repairNotesFormSchema>

export const REPAIR_NOTES_LIMIT = 2000
export const COMPLETION_NOTES_MESSAGE = 'Add repair notes before completing the work.'
