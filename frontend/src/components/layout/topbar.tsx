import { LogOut, Menu } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Brand } from '@/components/layout/brand'
import { Avatar } from '@/components/layout/persona-card'
import { Button } from '@/components/ui/button'
import type { RoleConfig } from '@/features/roles/roles'

type TopbarProps = {
  config: RoleConfig
  menuOpen: boolean
  onMenuClick: () => void
}

export function Topbar({ config, menuOpen, onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-card px-4 md:h-16 md:px-6 lg:px-8">
      <Button
        variant="secondary"
        size="icon"
        className="hidden border-border md:inline-flex lg:hidden"
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={menuOpen}
        aria-controls="navigation-drawer"
        onClick={onMenuClick}
      >
        <Menu className="size-5" aria-hidden="true" />
      </Button>
      <Brand className="md:hidden" />
      <div className="flex-1" />
      <div className="flex items-center gap-2.5">
        <Avatar initials={config.persona.initials} className="size-7 text-xs md:size-7" />
        <span className="hidden text-sm font-bold md:inline">{config.persona.name}</span>
      </div>
      <Button asChild variant="secondary" size="icon" className="border-border md:hidden">
        <Link to="/" aria-label="Switch role" title="Switch role (demo)">
          <LogOut className="size-[18px]" aria-hidden="true" />
        </Link>
      </Button>
    </header>
  )
}
