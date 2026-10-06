/**
 * Mirror of the role hierarchy in merchandising_backend/src/auth/roles.constants.ts.
 *
 * This is presentation only: it decides which screens to render, never what the
 * user may do. The backend RolesGuard is the authority and re-checks the role from
 * the verified token on every request, so editing this file cannot grant access.
 */

export const USER_ROLES = ['super_admin', 'admin', 'hr', 'employee', 'customer'] as const;

export type UserRole = (typeof USER_ROLES)[number];

const ROLE_RANK: Record<UserRole, number> = {
  customer: 0,
  employee: 1,
  hr: 2,
  admin: 3,
  super_admin: 4,
};

/** True when `actualRole` holds at least the privilege of `requiredRole`. Unknown roles fail closed. */
export function roleSatisfies(actualRole: unknown, requiredRole: unknown): boolean {
  if (typeof actualRole !== 'string' || typeof requiredRole !== 'string') {
    return false;
  }
  const actual = ROLE_RANK[actualRole as UserRole];
  const required = ROLE_RANK[requiredRole as UserRole];
  if (actual === undefined || required === undefined) {
    return false;
  }
  return actual >= required;
}

/** Convenience check for the staff-only surface of this admin app. */
export const isStaff = (role: unknown): boolean => roleSatisfies(role, 'admin');