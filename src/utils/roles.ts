/**
 * Mirror of the role hierarchy in merchandising_backend/src/auth/roles.constants.ts.
 *
 * This is presentation only: it decides which screens to render, never what the
 * user may do. The backend RolesGuard is the authority and re-checks the role from
 * the verified token on every request, so editing this file cannot grant access.
 */

export const USER_ROLES = [
  'super_admin',
  'admin',
  'ceo',
  'hr',
  'account',
  'finance',
  'sales',
  'marketing',
  'employee',
  'customer',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

const LADDER_RANK = {
  customer: 0,
  employee: 1,
  admin: 2,
  super_admin: 3,
} as const;

const DEPARTMENT_ROLES = ['hr', 'account', 'finance', 'sales', 'marketing'] as const;

/** Leadership view seat: small menu, not full admin privilege. */
const VIEW_ROLES = ['ceo'] as const;

type LadderRole = keyof typeof LADDER_RANK;

function isLadderRole(role: string): role is LadderRole {
  return Object.prototype.hasOwnProperty.call(LADDER_RANK, role);
}

function isDepartmentRole(role: string): boolean {
  return (DEPARTMENT_ROLES as readonly string[]).includes(role);
}

function isViewRole(role: string): boolean {
  return (VIEW_ROLES as readonly string[]).includes(role);
}

/** True when `actualRole` holds at least the privilege of `requiredRole`. Unknown roles fail closed. */
export function roleSatisfies(actualRole: unknown, requiredRole: unknown): boolean {
  if (typeof actualRole !== 'string' || typeof requiredRole !== 'string') {
    return false;
  }
  if (!(USER_ROLES as readonly string[]).includes(actualRole) || !(USER_ROLES as readonly string[]).includes(requiredRole)) {
    return false;
  }
  if (actualRole === requiredRole) {
    return true;
  }

  if (isLadderRole(actualRole) && LADDER_RANK[actualRole] >= LADDER_RANK.admin) {
    if (isLadderRole(requiredRole)) {
      return LADDER_RANK[actualRole] >= LADDER_RANK[requiredRole];
    }
    return isDepartmentRole(requiredRole) || isViewRole(requiredRole);
  }

  if (isDepartmentRole(actualRole)) {
    return isLadderRole(requiredRole) && LADDER_RANK[requiredRole] <= LADDER_RANK.employee;
  }

  if (isViewRole(actualRole)) {
    return false;
  }

  if (isLadderRole(actualRole) && isLadderRole(requiredRole)) {
    return LADDER_RANK[actualRole] >= LADDER_RANK[requiredRole];
  }

  return false;
}

/** Convenience check for admin and super admin. */
export const isStaff = (role: unknown): boolean => roleSatisfies(role, 'admin');

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super admin',
  admin: 'Admin',
  ceo: 'CEO',
  hr: 'Human resources',
  account: 'Account',
  finance: 'Finance',
  sales: 'Sales',
  marketing: 'Performance marketer',
  employee: 'Employee',
  customer: 'Customer',
};

/**
 * Screens each seat is allowed to open. Admin keeps the whole office except
 * user management, which stays with super admin. One person, one seat.
 * Super admin may override per person via `menuAccess` (cookie / login profile).
 * CEO: command pulse only (dashboard). Not Users, Projects, Integrations, etc.
 */
const WORKSPACES: Partial<Record<UserRole, string[]>> = {
  ceo: ['/dashboard'],
  hr: ['/applications', '/employees', '/vendors', '/vendor-partners'],
  account: ['/payments'],
  finance: ['/payments'],
  sales: ['/crm', '/leads'],
  marketing: ['/blogs', '/gallery', '/leads', '/crm'],
};

export const ADMIN_ROUTES = [
  '/dashboard',
  '/projects',
  '/leads',
  '/crm',
  '/applications',
  '/channel-partners',
  '/vendors',
  '/vendor-partners',
  '/listings',
  '/employees',
  '/payments',
  '/integrations',
  '/blogs',
  '/gallery',
];

/** Admin-panel screens only (not the Sales CRM desk). */
export const ADMIN_MENU_ROUTES = [
  '/dashboard',
  '/projects',
  '/leads',
  '/applications',
  '/channel-partners',
  '/vendors',
  '/vendor-partners',
  '/listings',
  '/users',
  '/employees',
  '/payments',
  '/integrations',
  '/blogs',
  '/gallery',
] as const;

/** CRM desk entry. Inner CRM nav still follows CRM seat until per-screen CRM menus ship. */
export const CRM_MENU_ROUTES = ['/crm'] as const;

/** Full catalog a super admin can tick in People and access (includes Users). */
export const STAFF_MENU_ROUTES = [
  ...ADMIN_MENU_ROUTES,
  ...CRM_MENU_ROUTES,
] as const;

export const STAFF_MENU_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/leads': 'Leads (admin)',
  '/crm': 'Sales CRM desk',
  '/applications': 'Applications',
  '/channel-partners': 'Channel partners',
  '/vendors': 'Vendor list',
  '/vendor-partners': 'Listed vendors',
  '/listings': 'Listings',
  '/users': 'People and access',
  '/employees': 'Employees',
  '/payments': 'Payments',
  '/integrations': 'Integrations',
  '/blogs': 'Blogs',
  '/gallery': 'Gallery',
};

export const USER_DEPARTMENTS = [
  'sales',
  'marketing',
  'hr',
  'accounts',
  'operations',
  'leadership',
  'other',
] as const;

export type UserDepartment = (typeof USER_DEPARTMENTS)[number];

export const DEPARTMENT_LABELS: Record<UserDepartment, string> = {
  sales: 'Sales',
  marketing: 'Marketing',
  hr: 'Human resources',
  accounts: 'Accounts / Finance',
  operations: 'Operations',
  leadership: 'Leadership',
  other: 'Other',
};

export function defaultDepartmentForRole(role: unknown): UserDepartment | '' {
  if (role === 'sales') return 'sales';
  if (role === 'marketing') return 'marketing';
  if (role === 'hr') return 'hr';
  if (role === 'account' || role === 'finance') return 'accounts';
  if (role === 'admin' || role === 'super_admin' || role === 'ceo') return 'leadership';
  if (role === 'employee') return 'operations';
  return '';
}

/** Role-default workspace. `null` = every route (super admin). */
export function roleDefaultRoutes(role: unknown): string[] | null {
  if (roleSatisfies(role, 'super_admin')) {
    return null;
  }
  if (roleSatisfies(role, 'admin')) {
    return [...ADMIN_ROUTES];
  }
  if (typeof role === 'string' && WORKSPACES[role as UserRole]) {
    return [...(WORKSPACES[role as UserRole] as string[])];
  }
  return [];
}

/**
 * Effective nav allowlist.
 * - Super admin: always all (`null`)
 * - Custom `menuAccess` array: that list
 * - Else: role defaults
 */
export function allowedRoutes(
  role: unknown,
  menuAccess?: string[] | null,
): string[] | null {
  if (roleSatisfies(role, 'super_admin')) {
    return null;
  }
  if (Array.isArray(menuAccess)) {
    return menuAccess;
  }
  return roleDefaultRoutes(role);
}

/** True for anyone who has a seat in this app. */
export const canEnterApp = (role: unknown, menuAccess?: string[] | null): boolean => {
  const routes = allowedRoutes(role, menuAccess);
  return routes === null || routes.length > 0;
};

export function homeRoute(role: unknown, menuAccess?: string[] | null): string {
  const routes = allowedRoutes(role, menuAccess);
  if (typeof role === 'string' && role === 'sales' && routes?.includes('/crm')) {
    return '/crm';
  }
  if (routes === null || routes.includes('/dashboard')) {
    return '/dashboard';
  }
  if (routes.includes('/crm')) {
    return '/crm';
  }
  return routes[0] ?? '/login';
}

export function canOpenRoute(
  role: unknown,
  path: string,
  menuAccess?: string[] | null,
): boolean {
  const routes = allowedRoutes(role, menuAccess);
  if (routes === null) {
    return true;
  }
  return routes.some((route) => path === route || path.startsWith(`${route}/`));
}

/** Read custom menu cookie set at login (JSON array or empty = role defaults). */
export function menuAccessFromCookie(raw: string | undefined | null): string[] | null {
  if (!raw || raw === 'null' || raw === '') return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : null;
  } catch {
    return null;
  }
}

export const DESK_ACCESS = ['admin', 'crm'] as const;
export type DeskAccess = (typeof DESK_ACCESS)[number];

export function defaultDeskAccessForRole(role: unknown): DeskAccess[] {
  if (role === 'super_admin' || role === 'admin') return ['admin', 'crm'];
  if (role === 'ceo') return ['admin'];
  if (role === 'sales' || role === 'marketing') return ['admin', 'crm'];
  if (role === 'hr' || role === 'account' || role === 'finance' || role === 'employee') {
    return ['admin'];
  }
  return [];
}

export function deskAccessFromCookie(raw: string | undefined | null): DeskAccess[] | null {
  if (!raw || raw === 'null' || raw === '') return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((v): v is DeskAccess => v === 'admin' || v === 'crm');
  } catch {
    return null;
  }
}

/** Effective desks: custom cookie/list, else role defaults. */
export function effectiveDeskAccess(
  role: unknown,
  deskAccess?: string[] | null,
): DeskAccess[] {
  if (roleSatisfies(role, 'super_admin')) return ['admin', 'crm'];
  if (Array.isArray(deskAccess) && deskAccess.length) {
    return deskAccess.filter((v): v is DeskAccess => v === 'admin' || v === 'crm');
  }
  return defaultDeskAccessForRole(role);
}

export function canOpenDesk(
  role: unknown,
  desk: DeskAccess,
  deskAccess?: string[] | null,
): boolean {
  return effectiveDeskAccess(role, deskAccess).includes(desk);
}
