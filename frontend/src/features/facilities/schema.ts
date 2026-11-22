import { z } from 'zod'

import type { FacilityPayload } from '@/features/facilities/types'

// Mirrors the backend rules in docs/api-contract.md. The server stays authoritative.
export const facilityFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Enter a name of at least 2 characters.')
    .max(100, 'Use 100 characters or fewer.'),
  building: z
    .string()
    .trim()
    .min(2, 'Enter a building of at least 2 characters.')
    .max(100, 'Use 100 characters or fewer.'),
  floor: z.string().trim().max(30, 'Use 30 characters or fewer.'),
  type: z.string().trim().min(1, 'Select a facility type.').max(50, 'Use 50 characters or fewer.'),
  description: z.string().trim().max(500, 'Use 500 characters or fewer.'),
})

export type FacilityFormValues = z.infer<typeof facilityFormSchema>

export const FACILITY_FIELD_LABELS: Record<keyof FacilityFormValues, string> = {
  name: 'Name',
  building: 'Building',
  floor: 'Floor',
  type: 'Type',
  description: 'Description',
}

export function toFacilityPayload(values: FacilityFormValues): FacilityPayload {
  return {
    name: values.name,
    building: values.building,
    floor: values.floor || null,
    type: values.type,
    description: values.description || null,
  }
}
