import { z } from 'zod'

import type { TechnicianPayload } from '@/features/technicians/types'

// Mirrors the backend rules in docs/api-contract.md. The server stays authoritative.
export const technicianFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Enter a name of at least 2 characters.')
    .max(100, 'Use 100 characters or fewer.'),
  specialization: z
    .string()
    .trim()
    .min(1, 'Enter a specialization.')
    .max(50, 'Use 50 characters or fewer.'),
  email: z.string().trim().min(1, 'Enter an email address.').email('Enter a valid email address.'),
  phone: z.string().trim().max(30, 'Use 30 characters or fewer.'),
  availability_status: z.enum(['Available', 'Unavailable']),
})

export type TechnicianFormValues = z.infer<typeof technicianFormSchema>

export const TECHNICIAN_FIELD_LABELS: Record<keyof TechnicianFormValues, string> = {
  name: 'Name',
  specialization: 'Specialization',
  email: 'Email',
  phone: 'Phone',
  availability_status: 'Availability',
}

export function toTechnicianPayload(values: TechnicianFormValues): TechnicianPayload {
  return {
    name: values.name,
    specialization: values.specialization,
    email: values.email,
    phone: values.phone || null,
    availability_status: values.availability_status,
  }
}
