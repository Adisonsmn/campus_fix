import { apiRequest } from '@/lib/api-client'
import type { Facility, FacilityPayload } from '@/features/facilities/types'

export function listFacilities() {
  return apiRequest<Facility[]>('/facilities')
}

export function createFacility(payload: FacilityPayload) {
  return apiRequest<Facility>('/facilities', { method: 'POST', body: payload })
}

export function updateFacility(id: number, payload: FacilityPayload) {
  return apiRequest<Facility>(`/facilities/${id}`, { method: 'PUT', body: payload })
}

export function deleteFacility(id: number) {
  return apiRequest<void>(`/facilities/${id}`, { method: 'DELETE' })
}
