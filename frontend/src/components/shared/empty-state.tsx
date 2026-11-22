import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: string
  actions?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, actions }: EmptyStateProps) {
  return (
    <section className="flex flex-col items-center gap-2 rounded-xl border bg-card px-6 py-12 text-center shadow-card">
      <span className="mb-2 flex size-14 items-center justify-center rounded-full bg-ice text-navy">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h2 className="text-base font-bold">{title}</h2>
      {description ? <p className="max-w-md text-muted-foreground">{description}</p> : null}
      {actions ? <div className="mt-3 flex flex-wrap justify-center gap-3">{actions}</div> : null}
    </section>
  )
}
