import { Construction } from 'lucide-react'

import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'

// TEMPORARY placeholder for pages that are not built yet (AGENTS.md).
// Delete this file and its usages in app/router.tsx before the project is declared complete.
export function NotImplemented({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState
        icon={Construction}
        title="Not implemented yet"
        description="This page is planned but has not been built in the current phase."
      />
    </>
  )
}
