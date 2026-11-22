export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Display-only label for the integer report id, e.g. 7 -> RPT-0007. */
export function formatReportId(id: number) {
  return `RPT-${String(id).padStart(4, '0')}`
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

/** Parses a positive integer route param such as "7"; returns null for anything else. */
export function parseRouteId(value: string | undefined) {
  return value !== undefined && /^[1-9]\d*$/.test(value) ? Number(value) : null
}
