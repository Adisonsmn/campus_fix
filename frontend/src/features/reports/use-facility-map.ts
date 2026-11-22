import { useMemo } from 'react'

import type { Facility } from '@/features/facilities/types'

/** Facility id -> facility, for joining facility names into report lists in the frontend. */
export function useFacilityMap(facilities: Facility[] | undefined) {
  return useMemo(
    () => new Map((facilities ?? []).map((facility) => [facility.id, facility])),
    [facilities],
  )
}
