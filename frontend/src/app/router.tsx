import type { ReactNode } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router-dom'

import { NotFoundPage } from '@/app/not-found-page'
import { AppShell } from '@/components/layout/app-shell'
import { NotImplemented } from '@/components/shared/not-implemented'
import { FacilitiesPage } from '@/features/facilities/facilities-page'
import { RoleSelectionPage } from '@/features/roles/role-selection-page'
import { TechniciansPage } from '@/features/technicians/technicians-page'
import { ROLE_LIST } from '@/features/roles/roles'

// Pages that are built, keyed by `<basePath>/<path>`. Everything else renders the
// temporary NotImplemented placeholder until its slice is built.
const implementedPages: Record<string, ReactNode> = {
  '/admin/facilities': <FacilitiesPage />,
  '/admin/technicians': <TechniciansPage />,
}

const roleRoutes: RouteObject[] = ROLE_LIST.map((config) => ({
  path: config.basePath,
  element: <AppShell role={config.role} />,
  children: config.pages.map((page) => {
    const element = implementedPages[
      page.path ? `${config.basePath}/${page.path}` : config.basePath
    ] ?? <NotImplemented title={page.title} />
    return page.path === '' ? { index: true, element } : { path: page.path, element }
  }),
}))

export const router = createBrowserRouter([
  { path: '/', element: <RoleSelectionPage /> },
  ...roleRoutes,
  { path: '*', element: <NotFoundPage /> },
])
