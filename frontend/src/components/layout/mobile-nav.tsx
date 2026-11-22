import { Link, useLocation } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { isNavActive, type NavItem } from '@/features/roles/roles'

/** Bottom tab bar, mobile only. */
export function MobileNav({ items }: { items: NavItem[] }) {
  const { pathname } = useLocation()

  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-30 mt-auto flex border-t bg-card px-1 pt-2 pb-2.5 md:hidden"
    >
      {items.map((item) => {
        const active = isNavActive(item, pathname)
        const Icon = item.icon
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-w-0 flex-1 flex-col items-center gap-1 px-0.5 leading-4 font-semibold',
              items.length > 4 ? 'text-[11px]' : 'text-xs',
              active ? 'text-navy' : 'text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'flex h-[30px] w-14 items-center justify-center rounded-full',
                active && 'bg-ice',
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span className="max-w-full truncate">{item.shortLabel ?? item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
