import type { ReactNode } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router-dom'

import { NotFoundPage } from '@/app/not-found-page'
import { AppShell } from '@/components/layout/app-shell'
import { FacilitiesPage } from '@/features/facilities/facilities-page'
import { AdminAssignmentsPage } from '@/features/assignments/admin-assignments-page'
import { TechnicianAssignmentDetailPage } from '@/features/assignments/technician-assignment-detail-page'
import { TechnicianMyAssignmentsPage } from '@/features/assignments/technician-my-assignments-page'
import { TechnicianDashboardPage } from '@/features/assignments/technician-dashboard-page'
import { AdminDashboardPage } from '@/features/reports/admin-dashboard-page'
import { AdminReportsPage } from '@/features/reports/admin-reports-page'
import { StudentDashboardPage } from '@/features/reports/student-dashboard-page'
import { StudentMyReportsPage } from '@/features/reports/student-my-reports-page'
import { StudentReportDetailPage } from '@/features/reports/student-report-detail-page'
import { StudentReportFormPage } from '@/features/reports/student-report-form-page'
import { RoleSelectionPage } from '@/features/roles/role-selection-page'
import { TechniciansPage } from '@/features/technicians/technicians-page'
import { ROLE_LIST } from '@/features/roles/roles'

// Page element for every entry in `ROLES[...].pages`, keyed by `<basePath>/<path>`.
const pageElements: Record<string, ReactNode> = {
  '/student': <StudentDashboardPage />,
  '/admin': <AdminDashboardPage />,
  '/technician': <TechnicianDashboardPage />,
  '/student/reports': <StudentMyReportsPage />,
  '/student/reports/new': <StudentReportFormPage mode="create" />,
  '/student/reports/:id': <StudentReportDetailPage />,
  '/student/reports/:id/edit': <StudentReportFormPage mode="edit" />,
  '/admin/reports': <AdminReportsPage />,
  '/admin/assignments': <AdminAssignmentsPage />,
  '/technician/assignments': <TechnicianMyAssignmentsPage />,
  '/technician/assignments/:id': <TechnicianAssignmentDetailPage />,
  '/admin/facilities': <FacilitiesPage />,
  '/admin/technicians': <TechniciansPage />,
}

const roleRoutes: RouteObject[] = ROLE_LIST.map((config) => ({
  path: config.basePath,
  element: <AppShell role={config.role} />,
  children: config.pages.map((page) => {
    const element = pageElements[page.path ? `${config.basePath}/${page.path}` : config.basePath]
    return page.path === '' ? { index: true, element } : { path: page.path, element }
  }),
}))

export const router = createBrowserRouter([
  { path: '/', element: <RoleSelectionPage /> },
  ...roleRoutes,
  { path: '*', element: <NotFoundPage /> },
])
