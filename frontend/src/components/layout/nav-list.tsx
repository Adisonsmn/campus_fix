import { Link, useLocation } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { isNavActive, type NavItem } from '@/features/roles/roles'

type NavListProps = {
  items: NavItem[]
  /** `responsive` collapses to icons below the desktop breakpoint (icon rail). */
  labels: 'responsive' | 'always'
  onNavigate?: () => void
}

export function NavList({ items, labels, onNavigate }: NavListProps) {
  const { pathname } = useLocation()

  return (
    <nav aria-label="Primary" className="flex flex-1 flex-col gap-1">
      {items.map((item) => {
        const active = isNavActive(item, pathname)
        const Icon = item.icon
        return (
          <Link
            key={item.to}
            to={item.to}
            title={item.label}
            aria-current={active ? 'page' : undefined}
            onClick={onNavigate}
            className={cn(
              'flex h-11 items-center gap-3 rounded-lg px-3 font-semibold transition-colors',
              labels === 'responsive' && 'max-lg:w-12 max-lg:justify-center max-lg:px-0',
              active ? 'bg-ice text-navy' : 'text-muted-foreground hover:bg-ice/40 hover:text-navy',
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            <span className={cn(labels === 'responsive' && 'max-lg:sr-only')}>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
