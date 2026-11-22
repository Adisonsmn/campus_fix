import {
  Building2,
  ClipboardCheck,
  ClipboardList,
  CirclePlus,
  FileText,
  LayoutDashboard,
  UserCog,
  type LucideIcon,
} from 'lucide-react'

export type Role = 'student' | 'admin' | 'technician'

/** Id of the seeded technician the demo Technician role acts as. Not authentication. */
export const DEMO_TECHNICIAN_ID = 1

export type NavItem = {
  label: string
  /** Shorter label for the mobile bottom bar. */
  shortLabel?: string
  to: string
  icon: LucideIcon
  /** Match only the exact path (dashboards). */
  end?: boolean
  /** Sub-paths that belong to another nav item. */
  exclude?: string[]
}

export type RolePage = {
  /** Path relative to the role's base path; '' is the index route. */
  path: string
  title: string
}

export type RoleConfig = {
  role: Role
  /** Role Selection card label. */
  label: string
  description: string
  basePath: string
  /** Fictional demo persona. Not authentication. */
  persona: { name: string; subtitle: string; initials: string; technicianId?: number }
  nav: NavItem[]
  pages: RolePage[]
}

export const ROLES: Record<Role, RoleConfig> = {
  student: {
    role: 'student',
    label: 'Student / Staff',
    description: 'Report broken facilities and follow the repair status.',
    basePath: '/student',
    persona: { name: 'Alya Putri', subtitle: 'Student · Engineering', initials: 'AP' },
    nav: [
      { label: 'Dashboard', to: '/student', icon: LayoutDashboard, end: true },
      {
        label: 'My Reports',
        shortLabel: 'Reports',
        to: '/student/reports',
        icon: FileText,
        exclude: ['/student/reports/new'],
      },
      {
        label: 'Create Report',
        shortLabel: 'Create',
        to: '/student/reports/new',
        icon: CirclePlus,
      },
    ],
    pages: [
      { path: '', title: 'Dashboard' },
      { path: 'reports', title: 'My Reports' },
      { path: 'reports/new', title: 'Report a Facility Issue' },
      { path: 'reports/:id', title: 'Report Detail' },
      { path: 'reports/:id/edit', title: 'Edit Report' },
    ],
  },
  admin: {
    role: 'admin',
    label: 'Administrator',
    description: 'Manage facilities, technicians and reports, and assign repairs.',
    basePath: '/admin',
    persona: { name: 'Rina Wulandari', subtitle: 'Administrator', initials: 'RW' },
    nav: [
      { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
      { label: 'Reports', to: '/admin/reports', icon: FileText },
      { label: 'Facilities', to: '/admin/facilities', icon: Building2 },
      { label: 'Technicians', to: '/admin/technicians', icon: UserCog },
      { label: 'Assignments', to: '/admin/assignments', icon: ClipboardList },
    ],
    pages: [
      { path: '', title: 'Dashboard' },
      { path: 'reports', title: 'Reports' },
      { path: 'facilities', title: 'Facilities' },
      { path: 'technicians', title: 'Technicians' },
      { path: 'assignments', title: 'Assignments' },
    ],
  },
  technician: {
    role: 'technician',
    label: 'Technician',
    description: 'See your assigned repairs, start work and record notes.',
    basePath: '/technician',
    persona: {
      name: 'Dewi Lestari',
      subtitle: 'Technician',
      initials: 'DL',
      technicianId: DEMO_TECHNICIAN_ID,
    },
    nav: [
      { label: 'Dashboard', to: '/technician', icon: LayoutDashboard, end: true },
      {
        label: 'My Assignments',
        shortLabel: 'Assignments',
        to: '/technician/assignments',
        icon: ClipboardCheck,
      },
    ],
    pages: [
      { path: '', title: 'Dashboard' },
      { path: 'assignments', title: 'My Assignments' },
      { path: 'assignments/:id', title: 'Assignment Detail' },
    ],
  },
}

export const ROLE_LIST: RoleConfig[] = [ROLES.student, ROLES.admin, ROLES.technician]

function matchesPath(pathname: string, target: string) {
  return pathname === target || pathname.startsWith(`${target}/`)
}

export function isNavActive(item: NavItem, pathname: string) {
  if (item.end) return pathname === item.to
  if (item.exclude?.some((path) => matchesPath(pathname, path))) return false
  return matchesPath(pathname, item.to)
}
