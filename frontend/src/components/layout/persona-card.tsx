import { LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { RoleConfig } from '@/features/roles/roles'

export function Avatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-full bg-navy text-[13px] font-bold text-white',
        className,
      )}
    >
      {initials}
    </span>
  )
}

type PersonaCardProps = {
  config: RoleConfig
  /** `responsive` collapses to avatar + icon below the desktop breakpoint (icon rail). */
  layout: 'responsive' | 'full'
}

/** Demo persona and the Switch role action. This is not authentication. */
export function PersonaCard({ config, layout }: PersonaCardProps) {
  const responsive = layout === 'responsive'
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border p-3',
        responsive && 'max-lg:flex-col max-lg:border-0 max-lg:p-0',
      )}
    >
      <Avatar initials={config.persona.initials} />
      <div className={cn('min-w-0 flex-1', responsive && 'max-lg:hidden')}>
        <p className="truncate text-sm leading-[18px] font-bold">{config.persona.name}</p>
        <p className="text-[13px] leading-[18px] text-muted-foreground">
          {config.persona.subtitle}
        </p>
      </div>
      <Button asChild variant="ghost" size="icon-sm" className="border-border">
        <Link to="/" aria-label="Switch role" title="Switch role (demo)">
          <LogOut className="size-[18px]" aria-hidden="true" />
        </Link>
      </Button>
    </div>
  )
}
