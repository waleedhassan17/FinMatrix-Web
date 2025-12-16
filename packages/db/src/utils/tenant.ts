import { db, createTenantSchema, deleteTenantSchema, withTenantDb } from '../client';
import { organizations, organizationMembers, userRoles, roles } from '../schema';
import { eq, and } from 'drizzle-orm';
import type { NewOrganization } from '../schema';

/**
 * Generate a unique schema name from organization name
 */
export const generateSchemaName = (orgName: string): string => {
  // Convert to lowercase, replace spaces with underscores, remove special chars
  const base = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 50);

  // Add a short random suffix to ensure uniqueness
  const suffix = Math.random().toString(36).substring(2, 8);
  return `tenant_${base}_${suffix}`;
};

/**
 * Generate a URL-friendly slug from organization name
 */
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
};

/**
 * Create a new tenant (organization) with its schema
 */
export const createTenant = async (
  data: {
    name: string;
    ownerId: string;
    email?: string;
    phone?: string;
    businessType?: string;
    ntn?: string;
    strn?: string;
  }
): Promise<typeof organizations.$inferSelect> => {
  const slug = generateSlug(data.name);
  const schemaName = generateSchemaName(data.name);

  // Create the organization record
  const [organization] = await db
    .insert(organizations)
    .values({
      name: data.name,
      slug,
      schemaName,
      email: data.email,
      phone: data.phone,
      businessType: data.businessType,
      ntn: data.ntn,
      strn: data.strn,
      settings: {
        fiscalYearStart: 7, // July (Pakistani fiscal year)
        currency: 'PKR',
        timezone: 'Asia/Karachi',
        dateFormat: 'DD/MM/YYYY',
        enableGst: true,
        gstRate: 17,
      },
    })
    .returning();

  // Create the tenant schema in PostgreSQL
  await createTenantSchema(schemaName);

  // Add owner as organization member
  await db.insert(organizationMembers).values({
    userId: data.ownerId,
    organizationId: organization.id,
    isOwner: true,
  });

  // Assign org_owner role to the owner
  const ownerRole = await db.query.roles.findFirst({
    where: eq(roles.slug, 'org_owner'),
  });

  if (ownerRole) {
    await db.insert(userRoles).values({
      userId: data.ownerId,
      roleId: ownerRole.id,
      organizationId: organization.id,
    });
  }

  return organization;
};

/**
 * Get tenant by ID
 */
export const getTenantById = async (id: string) => {
  return db.query.organizations.findFirst({
    where: eq(organizations.id, id),
  });
};

/**
 * Get tenant by slug
 */
export const getTenantBySlug = async (slug: string) => {
  return db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
  });
};

/**
 * Get tenant by schema name
 */
export const getTenantBySchema = async (schemaName: string) => {
  return db.query.organizations.findFirst({
    where: eq(organizations.schemaName, schemaName),
  });
};

/**
 * Get all tenants for a user
 */
export const getUserTenants = async (userId: string) => {
  const memberships = await db.query.organizationMembers.findMany({
    where: eq(organizationMembers.userId, userId),
    with: {
      organization: true,
    },
  });

  return memberships.map((m) => ({
    ...m.organization,
    isOwner: m.isOwner,
    joinedAt: m.joinedAt,
  }));
};

/**
 * Check if user is member of tenant
 */
export const isUserMemberOfTenant = async (
  userId: string,
  organizationId: string
): Promise<boolean> => {
  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.organizationId, organizationId)
    ),
  });

  return !!membership;
};

/**
 * Delete a tenant and its schema (use with caution!)
 */
export const deleteTenant = async (organizationId: string): Promise<void> => {
  const org = await getTenantById(organizationId);
  
  if (!org) {
    throw new Error('Organization not found');
  }

  // Delete the PostgreSQL schema
  await deleteTenantSchema(org.schemaName);

  // Delete the organization (cascades to members, user_roles, etc.)
  await db.delete(organizations).where(eq(organizations.id, organizationId));
};

/**
 * Update tenant settings
 */
export const updateTenantSettings = async (
  organizationId: string,
  settings: Partial<typeof organizations.$inferSelect>
) => {
  const [updated] = await db
    .update(organizations)
    .set({
      ...settings,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, organizationId))
    .returning();

  return updated;
};

export { withTenantDb };
