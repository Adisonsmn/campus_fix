export const AVAILABILITY_STATUSES = ['Available', 'Unavailable'] as const
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number]

/** Suggestions only: the server accepts any specialization of 1-50 characters. */
export const SPECIALIZATION_SUGGESTIONS = [
  'Electrical',
  'Plumbing',
  'HVAC',
  'IT',
  'General',
] as const

export type Technician = {
  id: number
  name: string
  specialization: string
  email: string
  phone: string | null
  availability_status: AvailabilityStatus
}

/** Body for create and update. The server generates `id`. */
export type TechnicianPayload = Omit<Technician, 'id'>
