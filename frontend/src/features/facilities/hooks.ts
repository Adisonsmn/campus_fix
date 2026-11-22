import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createFacility,
  deleteFacility,
  listFacilities,
  updateFacility,
} from '@/features/facilities/api'
import type { FacilityPayload } from '@/features/facilities/types'

export const facilityKeys = {
  all: ['facilities'] as const,
  list: () => [...facilityKeys.all, 'list'] as const,
}

export function useFacilities() {
  return useQuery({ queryKey: facilityKeys.list(), queryFn: listFacilities })
}

function useInvalidateFacilities() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: facilityKeys.all })
}

export function useCreateFacility() {
  const invalidate = useInvalidateFacilities()
  return useMutation({
    mutationFn: (payload: FacilityPayload) => createFacility(payload),
    onSettled: invalidate,
  })
}

export function useUpdateFacility() {
  const invalidate = useInvalidateFacilities()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FacilityPayload }) =>
      updateFacility(id, payload),
    onSettled: invalidate,
  })
}

export function useDeleteFacility() {
  const invalidate = useInvalidateFacilities()
  return useMutation({
    mutationFn: (id: number) => deleteFacility(id),
    onSettled: invalidate,
  })
}
