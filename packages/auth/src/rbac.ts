import { redirect } from 'next/navigation';
import { getSession, requireOrganization } from './session';
import { getUserPermissionsInOrg, getUserRoleInOrg, type SystemRole } from '@finmatrix/db';

// Role hierarchy (higher roles include permissions of lower roles)
const roleHierarchy: Record<string, number> = {
  super_admin: 100,
  org_owner: 90,
  admin: 80,
  accountant: 60,
  bookkeeper: 40,
  viewer: 20,
};

/**
 * Check if a user has a specific role in the current organization
 */
export const checkRole = async (
  allowedRoles: SystemRole[],
  options?: { redirectTo?: string }
): Promise<boolean> => {
  const session = await getSession();

  if (!session?.user.currentOrganizationId || !session.user.role) {
    if (options?.redirectTo) {
      redirect(options.redirectTo);
    }
    return false;
  }

  const userRole = session.user.role;
  const isAllowed = allowedRoles.includes(userRole as SystemRole);

  if (!isAllowed && options?.redirectTo) {
    redirect(options.redirectTo);
  }

  return isAllowed;
};

/**
 * Require specific roles - throws/redirects if user doesn't have required role
 */
export const requireRole = async (
  allowedRoles: SystemRole[],
  redirectTo: string = '/dashboard'
): Promise<void> => {
  await checkRole(allowedRoles, { redirectTo });
};

/**
 * Check if user has at least a minimum role level
 */
export const hasMinimumRole = async (
  minimumRole: SystemRole
): Promise<boolean> => {
  const session = await getSession();

  if (!session?.user.role) {
    return false;
  }

  const userRoleLevel = roleHierarchy[session.user.role] || 0;
  const requiredLevel = roleHierarchy[minimumRole] || 0;

  return userRoleLevel >= requiredLevel;
};

/**
 * Check if user has a specific permission
 */
export const checkPermission = async (
  permissionSlug: string
): Promise<boolean> => {
  const session = await getSession();

  if (!session?.user.id || !session.user.currentOrganizationId) {
    return false;
  }

  const permissions = await getUserPermissionsInOrg(
    session.user.id,
    session.user.currentOrganizationId
  );

  return permissions.includes(permissionSlug);
};

/**
 * Require a specific permission - redirects if user doesn't have it
 */
export const requirePermission = async (
  permissionSlug: string,
  redirectTo: string = '/dashboard'
): Promise<void> => {
  const hasPermission = await checkPermission(permissionSlug);

  if (!hasPermission) {
    redirect(redirectTo);
  }
};

/**
 * Check if user has any of the specified permissions
 */
export const checkAnyPermission = async (
  permissionSlugs: string[]
): Promise<boolean> => {
  const session = await getSession();

  if (!session?.user.id || !session.user.currentOrganizationId) {
    return false;
  }

  const permissions = await getUserPermissionsInOrg(
    session.user.id,
    session.user.currentOrganizationId
  );

  return permissionSlugs.some((slug) => permissions.includes(slug));
};

/**
 * Check if user has all of the specified permissions
 */
export const checkAllPermissions = async (
  permissionSlugs: string[]
): Promise<boolean> => {
  const session = await getSession();

  if (!session?.user.id || !session.user.currentOrganizationId) {
    return false;
  }

  const permissions = await getUserPermissionsInOrg(
    session.user.id,
    session.user.currentOrganizationId
  );

  return permissionSlugs.every((slug) => permissions.includes(slug));
};

/**
 * Get all permissions for the current user in the current organization
 */
export const getCurrentUserPermissions = async (): Promise<string[]> => {
  const session = await getSession();

  if (!session?.user.id || !session.user.currentOrganizationId) {
    return [];
  }

  return getUserPermissionsInOrg(session.user.id, session.user.currentOrganizationId);
};

/**
 * Check if user is an admin (admin, org_owner, or super_admin)
 */
export const isAdmin = async (): Promise<boolean> => {
  return hasMinimumRole('admin');
};

/**
 * Check if user is the organization owner
 */
export const isOrgOwner = async (): Promise<boolean> => {
  return hasMinimumRole('org_owner');
};

/**
 * Check if user is a super admin
 */
export const isSuperAdmin = async (): Promise<boolean> => {
  const session = await getSession();
  return session?.user.role === 'super_admin';
};

// Export role constants for convenience
export const ROLES = {
  SUPER_ADMIN: 'super_admin' as const,
  ORG_OWNER: 'org_owner' as const,
  ADMIN: 'admin' as const,
  ACCOUNTANT: 'accountant' as const,
  BOOKKEEPER: 'bookkeeper' as const,
  VIEWER: 'viewer' as const,
};

// Permission constants
export const PERMISSIONS = {
  // Organization
  ORG_READ: 'organization:read',
  ORG_UPDATE: 'organization:update',
  ORG_DELETE: 'organization:delete',
  
  // Users
  USERS_READ: 'users:read',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  
  // Roles
  ROLES_READ: 'roles:read',
  ROLES_CREATE: 'roles:create',
  ROLES_UPDATE: 'roles:update',
  ROLES_DELETE: 'roles:delete',
  
  // Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',
  
  // Dashboard
  DASHBOARD_READ: 'dashboard:read',
  
  // Reports
  REPORTS_READ: 'reports:read',
  REPORTS_EXPORT: 'reports:export',
  
  // Chart of Accounts
  COA_READ: 'coa:read',
  COA_CREATE: 'coa:create',
  COA_UPDATE: 'coa:update',
  COA_DELETE: 'coa:delete',
  
  // Journal Entries
  JOURNAL_READ: 'journal:read',
  JOURNAL_CREATE: 'journal:create',
  JOURNAL_UPDATE: 'journal:update',
  JOURNAL_DELETE: 'journal:delete',
  JOURNAL_POST: 'journal:post',
  
  // Invoices
  INVOICES_READ: 'invoices:read',
  INVOICES_CREATE: 'invoices:create',
  INVOICES_UPDATE: 'invoices:update',
  INVOICES_DELETE: 'invoices:delete',
} as const;
