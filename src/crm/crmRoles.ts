/**
 * Day 15 stub CRM roles. Real crmRole / reportsTo APIs come later.
 * Presentation + home redirect only; API still uses user_type.
 */

export const CRM_ROLES = [
  'salesperson',
  'sales_manager',
  'sales_team_lead',
  'crm_admin',
] as const;

export type CrmRole = (typeof CRM_ROLES)[number];

export const CRM_ROLE_LABELS: Record<CrmRole, string> = {
  salesperson: 'Salesperson',
  sales_manager: 'Sales manager',
  sales_team_lead: 'Sales team lead',
  crm_admin: 'CRM Admin',
};

/** Map today’s ops user_type onto a CRM desk seat until hierarchy APIs exist. */
export function stubCrmRoleFromUserType(userType: unknown): CrmRole {
  const role = String(userType || '').trim().toLowerCase();
  if (role === 'super_admin' || role === 'admin') return 'crm_admin';
  if (role === 'sales') return 'salesperson';
  if (role === 'marketing') return 'salesperson';
  return 'salesperson';
}

export function isCrmRole(value: unknown): value is CrmRole {
  return typeof value === 'string' && (CRM_ROLES as readonly string[]).includes(value);
}

/** After CRM login, land on the role’s stub home. */
export function crmHomeRoute(crmRole: unknown): string {
  const role = isCrmRole(crmRole) ? crmRole : 'salesperson';
  switch (role) {
    case 'sales_manager':
      return '/crm';
    case 'sales_team_lead':
      return '/crm/team';
    case 'crm_admin':
      return '/crm/settings';
    case 'salesperson':
    default:
      return '/crm';
  }
}

export function crmHomeBlurb(crmRole: unknown): string {
  const role = isCrmRole(crmRole) ? crmRole : 'salesperson';
  switch (role) {
    case 'sales_manager':
      return 'Manager stub home. Your My Day is here; Team opens your line of people.';
    case 'sales_team_lead':
      return 'Team lead stub home. Org clarity and project access land on Team and Projects.';
    case 'crm_admin':
      return 'CRM Admin stub home. Roles, access, and templates live under Settings, not ops Users.';
    case 'salesperson':
    default:
      return 'Your My Day. Call and WhatsApp use your phone. No Outpero on this desk.';
  }
}
