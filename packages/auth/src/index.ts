// NextAuth configuration
export { authOptions } from './config';

// Session utilities
export {
  getSession,
  getCurrentUser,
  requireAuth,
  requireOrganization,
  getOrganizationId,
  getOrganizationSlug,
  isAuthenticated,
  isInOrganization,
  type Session,
  type SessionUser,
} from './session';

// RBAC utilities
export {
  checkRole,
  requireRole,
  hasMinimumRole,
  checkPermission,
  requirePermission,
  checkAnyPermission,
  checkAllPermissions,
  getCurrentUserPermissions,
  isAdmin,
  isOrgOwner,
  isSuperAdmin,
  ROLES,
  PERMISSIONS,
} from './rbac';

// Password utilities
export {
  hashPassword,
  verifyPassword,
  validatePassword,
} from './password';
