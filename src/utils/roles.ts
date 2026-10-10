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
  'hr',
  'account',
  'finance',
  'sales',
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

const DEPARTMENT_ROLES = ['hr', 'account', 'finance', 'sales'] as const;

type LadderRole = keyof typeof LADDER_RANK;

function isLadderRole(role: string): role is LadderRole {
  return Object.prototype.hasOwnProperty.call(LADDER_RANK, role);
}

function isDepartmentRole(role: string): boolean {
  return (DEPARTMENT_ROLES as readonly string[]).includes(role);
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
    return isDepartmentRole(requiredRole);
  }

  if (isDepartmentRole(actualRole)) {
    return isLadderRole(requiredRole) && LADDER_RANK[requiredRole] <= LADDER_RANK.employee;
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
  hr: 'Human resources',
  account: 'Account',
  finance: 'Finance',
  sales: 'Sales',
  employee: 'Employee',
  customer: 'Customer',
};

/**
 * Screens each seat is allowed to open. Admin keeps the whole office except
 * user management, which stays with super admin. One person, one seat.
 */
const WORKSPACES: Partial<Record<UserRole, string[]>> = {
  hr: ['/applications', '/employees'],
  account: ['/payments'],
  finance: ['/payments'],
  sales: ['/leads'],
};

const ADMIN_ROUTES = [
  '/dashboard',
  '/projects',
  '/leads',
  '/applications',
  '/channel-partners',
  '/employees',
  '/payments',
  '/integrations',
];

/** `null` means every route, including user management. */
export function allowedRoutes(role: unknown): string[] | null {
  if (roleSatisfies(role, 'super_admin')) {
    return null;
  }
  if (roleSatisfies(role, 'admin')) {
    return ADMIN_ROUTES;
  }
  if (typeof role === 'string' && WORKSPACES[role as UserRole]) {
    return WORKSPACES[role as UserRole] as string[];
  }
  return [];
}

/** True for anyone who has a seat in this app. */
export const canEnterApp = (role: unknown): boolean => {
  const routes = allowedRoutes(role);
  return routes === null || routes.length > 0;
};

export function homeRoute(role: unknown): string {
  const routes = allowedRoutes(role);
  if (routes === null || routes.includes('/dashboard')) {
    return '/dashboard';
  }
  return routes[0] ?? '/login';
}

export function canOpenRoute(role: unknown, path: string): boolean {
  const routes = allowedRoutes(role);
  if (routes === null) {
    return true;
  }
  return routes.some((route) => path === route || path.startsWith(`${route}/`));
}
