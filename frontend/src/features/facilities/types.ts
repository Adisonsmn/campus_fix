export const FACILITY_TYPES = ['Classroom', 'Laboratory', 'Library', 'Restroom', 'Other'] as const

export type Facility = {
  id: number
  name: string
  building: string
  floor: string | null
  type: string
  description: string | null
}

/** Body for create and update. The server generates `id`. */
export type FacilityPayload = Omit<Facility, 'id'>
