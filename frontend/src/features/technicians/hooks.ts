import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createTechnician,
  deleteTechnician,
  listTechnicians,
  updateTechnician,
} from '@/features/technicians/api'
import type { TechnicianPayload } from '@/features/technicians/types'

export const technicianKeys = {
  all: ['technicians'] as const,
  list: () => [...technicianKeys.all, 'list'] as const,
}

export function useTechnicians() {
  return useQuery({ queryKey: technicianKeys.list(), queryFn: listTechnicians })
}

function useInvalidateTechnicians() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: technicianKeys.all })
}

export function useCreateTechnician() {
  const invalidate = useInvalidateTechnicians()
  return useMutation({
    mutationFn: (payload: TechnicianPayload) => createTechnician(payload),
    onSettled: invalidate,
  })
}

export function useUpdateTechnician() {
  const invalidate = useInvalidateTechnicians()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TechnicianPayload }) =>
      updateTechnician(id, payload),
    onSettled: invalidate,
  })
}

export function useDeleteTechnician() {
  const invalidate = useInvalidateTechnicians()
  return useMutation({
    mutationFn: (id: number) => deleteTechnician(id),
    onSettled: invalidate,
  })
}
