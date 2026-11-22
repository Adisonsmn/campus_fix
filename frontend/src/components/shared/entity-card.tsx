import type { ReactNode } from 'react'

type EntityCardProps = {
  title: ReactNode
  subtitle?: string
  actions?: ReactNode
  children?: ReactNode
}

/** Mobile replacement for a table row. */
export function EntityCard({ title, subtitle, actions, children }: EntityCardProps) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold break-words">{title}</h3>
          {subtitle ? <p className="text-[13px] text-muted-foreground">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </article>
  )
}
