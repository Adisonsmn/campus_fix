import { apiRequest } from '@/lib/api-client'
import type { Technician, TechnicianPayload } from '@/features/technicians/types'

export function listTechnicians() {
  return apiRequest<Technician[]>('/technicians')
}

export function createTechnician(payload: TechnicianPayload) {
  return apiRequest<Technician>('/technicians', { method: 'POST', body: payload })
}

export function updateTechnician(id: number, payload: TechnicianPayload) {
  return apiRequest<Technician>(`/technicians/${id}`, { method: 'PUT', body: payload })
}

export function deleteTechnician(id: number) {
  return apiRequest<void>(`/technicians/${id}`, { method: 'DELETE' })
}
