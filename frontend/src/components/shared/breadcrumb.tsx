import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

type BreadcrumbProps = {
  /** Parent crumbs, then the current page label. */
  parents: { label: string; to: string }[]
  current: string
}

export function Breadcrumb({ parents, current }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="text-[13px]">
      <ol className="flex flex-wrap items-center gap-1.5">
        {parents.map((parent) => (
          <li key={parent.to} className="flex items-center gap-1.5">
            <Link to={parent.to} className="font-semibold text-teal hover:underline">
              {parent.label}
            </Link>
            <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
          </li>
        ))}
        <li aria-current="page" className="font-semibold">
          {current}
        </li>
      </ol>
    </nav>
  )
}
