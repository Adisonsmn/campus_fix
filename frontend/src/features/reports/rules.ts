import type { Report } from '@/features/reports/types'

/**
 * Reports may be edited or deleted only while Open (an assignment moves the status on).
 * The backend enforces the same rule; this only decides which actions to offer.
 */
export function isReportEditable(report: Report) {
  return report.status === 'Open'
}
