import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[22px] leading-7 font-extrabold tracking-tight md:text-2xl md:leading-8">
          {title}
        </h1>
        {description ? <p className="mt-1 text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap gap-3 max-md:w-full max-md:*:flex-1">{actions}</div>
      ) : null}
    </div>
  )
}
