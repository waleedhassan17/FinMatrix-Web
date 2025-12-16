import { db } from '../client';
import { users, userRoles, organizationMembers, roles, rolePermissions, permissions } from '../schema';
import { eq, and, inArray } from 'drizzle-orm';
import type { NewUser } from '../schema';

/**
 * Create a new user
 */
export const createUser = async (data: NewUser) => {
  const [user] = await db.insert(users).values(data).returning();
  return user;
};

/**
 * Get user by ID
 */
export const getUserById = async (id: string) => {
  return db.query.users.findFirst({
    where: eq(users.id, id),
  });
};

/**
 * Get user by email
 */
export const getUserByEmail = async (email: string) => {
  return db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });
};

/**
 * Update user
 */
export const updateUser = async (id: string, data: Partial<NewUser>) => {
  const [updated] = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  return updated;
};

/**
 * Get user's role within an organization
 */
export const getUserRoleInOrg = async (userId: string, organizationId: string) => {
  const userRole = await db.query.userRoles.findFirst({
    where: and(
      eq(userRoles.userId, userId),
      eq(userRoles.organizationId, organizationId)
    ),
    with: {
      role: true,
    },
  });

  return userRole?.role || null;
};

/**
 * Get user's permissions within an organization
 */
export const getUserPermissionsInOrg = async (
  userId: string,
  organizationId: string
): Promise<string[]> => {
  // Get user's role in the organization
  const userRole = await db.query.userRoles.findFirst({
    where: and(
      eq(userRoles.userId, userId),
      eq(userRoles.organizationId, organizationId)
    ),
  });

  if (!userRole) {
    return [];
  }

  // Get permissions for the role
  const rolePerm = await db.query.rolePermissions.findMany({
    where: eq(rolePermissions.roleId, userRole.roleId),
    with: {
      permission: true,
    },
  });

  return rolePerm.map((rp) => rp.permission.slug);
};

/**
 * Check if user has a specific permission in an organization
 */
export const userHasPermission = async (
  userId: string,
  organizationId: string,
  permissionSlug: string
): Promise<boolean> => {
  const permissions = await getUserPermissionsInOrg(userId, organizationId);
  return permissions.includes(permissionSlug);
};

/**
 * Check if user has any of the specified permissions
 */
export const userHasAnyPermission = async (
  userId: string,
  organizationId: string,
  permissionSlugs: string[]
): Promise<boolean> => {
  const userPermissions = await getUserPermissionsInOrg(userId, organizationId);
  return permissionSlugs.some((slug) => userPermissions.includes(slug));
};

/**
 * Check if user has all of the specified permissions
 */
export const userHasAllPermissions = async (
  userId: string,
  organizationId: string,
  permissionSlugs: string[]
): Promise<boolean> => {
  const userPermissions = await getUserPermissionsInOrg(userId, organizationId);
  return permissionSlugs.every((slug) => userPermissions.includes(slug));
};

/**
 * Assign a role to a user in an organization
 */
export const assignRoleToUser = async (
  userId: string,
  roleId: string,
  organizationId: string,
  assignedById?: string
) => {
  // Remove existing role in this organization
  await db.delete(userRoles).where(
    and(
      eq(userRoles.userId, userId),
      eq(userRoles.organizationId, organizationId)
    )
  );

  // Assign new role
  const [assigned] = await db
    .insert(userRoles)
    .values({
      userId,
      roleId,
      organizationId,
      assignedBy: assignedById,
    })
    .returning();

  return assigned;
};

/**
 * Get all users in an organization with their roles
 */
export const getOrganizationUsers = async (organizationId: string) => {
  const members = await db.query.organizationMembers.findMany({
    where: eq(organizationMembers.organizationId, organizationId),
    with: {
      user: true,
    },
  });

  // Get roles for each user
  const usersWithRoles = await Promise.all(
    members.map(async (member) => {
      const role = await getUserRoleInOrg(member.userId, organizationId);
      return {
        ...member.user,
        isOwner: member.isOwner,
        joinedAt: member.joinedAt,
        role: role?.name || 'No Role',
        roleSlug: role?.slug || null,
      };
    })
  );

  return usersWithRoles;
};

/**
 * Update user's last login timestamp
 */
export const updateLastLogin = async (userId: string) => {
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, userId));
};
