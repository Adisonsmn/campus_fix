import { useEffect, useState } from 'react'
import { LogOut } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'

import { MobileNav } from '@/components/layout/mobile-nav'
import { NavList } from '@/components/layout/nav-list'
import { PersonaCard } from '@/components/layout/persona-card'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { ROLES, type Role } from '@/features/roles/roles'

const DESKTOP_QUERY = '(min-width: 64rem)'

export function AppShell({ role }: { role: Role }) {
  const config = ROLES[role]
  const [drawerOpen, setDrawerOpen] = useState(false)

  // The drawer only exists on tablet; close it when the persistent sidebar takes over.
  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY)
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setDrawerOpen(false)
    }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return (
    <div className="flex min-h-svh">
      <Sidebar config={config} />

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        {/* Starts below the 64px topbar so the hamburger stays visible and toggles the drawer. */}
        <SheetContent
          id="navigation-drawer"
          side="left"
          hideClose
          overlayClassName="top-16 lg:hidden"
          className="top-16 h-[calc(100svh-4rem)] px-4 py-5 lg:hidden"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Pages available to the {config.label} demo role.
          </SheetDescription>

          <NavList items={config.nav} labels="always" onNavigate={() => setDrawerOpen(false)} />
          <PersonaCard config={config} layout="full" />
          <Button asChild variant="secondary">
            <Link to="/">
              <LogOut className="size-[18px]" aria-hidden="true" />
              Switch role
            </Link>
          </Button>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          config={config}
          menuOpen={drawerOpen}
          onMenuClick={() => setDrawerOpen((open) => !open)}
        />
        <main className="flex w-full max-w-[1264px] flex-col gap-5 p-4 pb-6 md:gap-6 md:p-6 lg:p-8">
          <Outlet />
        </main>
        <MobileNav items={config.nav} />
      </div>
    </div>
  )
}
