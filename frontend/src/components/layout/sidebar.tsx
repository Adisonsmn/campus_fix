import { Brand } from '@/components/layout/brand'
import { NavList } from '@/components/layout/nav-list'
import { PersonaCard } from '@/components/layout/persona-card'
import type { RoleConfig } from '@/features/roles/roles'

/** Persistent 248px sidebar on desktop, 72px icon rail on tablet. Hidden on mobile. */
export function Sidebar({ config }: { config: RoleConfig }) {
  return (
    <aside className="sticky top-0 hidden h-svh w-[72px] shrink-0 flex-col gap-6 border-r bg-card px-3 py-5 md:flex lg:w-[248px] lg:px-4">
      <Brand collapsible className="max-lg:justify-center lg:px-2" />
      <NavList items={config.nav} labels="responsive" />
      <PersonaCard config={config} layout="responsive" />
    </aside>
  )
}
