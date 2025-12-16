import * as dotenv from 'dotenv';
import { db } from './client';
import { roles, permissions, rolePermissions } from './schema';
import { eq } from 'drizzle-orm';

// Load environment variables from root .env
dotenv.config({ path: '../../.env' });

// Default system roles
const systemRoles = [
  {
    name: 'Super Admin',
    slug: 'super_admin',
    description: 'Full system access across all tenants',
    systemRole: 'super_admin' as const,
    isSystem: true,
  },
  {
    name: 'Organization Owner',
    slug: 'org_owner',
    description: 'Full access to organization settings and data',
    systemRole: 'org_owner' as const,
    isSystem: true,
  },
  {
    name: 'Admin',
    slug: 'admin',
    description: 'Administrative access to organization features',
    systemRole: 'admin' as const,
    isSystem: true,
  },
  {
    name: 'Accountant',
    slug: 'accountant',
    description: 'Full access to accounting features',
    systemRole: 'accountant' as const,
    isSystem: true,
  },
  {
    name: 'Bookkeeper',
    slug: 'bookkeeper',
    description: 'Data entry and basic reporting access',
    systemRole: 'bookkeeper' as const,
    isSystem: true,
  },
  {
    name: 'Viewer',
    slug: 'viewer',
    description: 'Read-only access to reports and dashboards',
    systemRole: 'viewer' as const,
    isSystem: true,
  },
];

// Default permissions
const defaultPermissions = [
  // Organization management
  { name: 'View Organization', slug: 'organization:read', resource: 'organization', action: 'read' },
  { name: 'Edit Organization', slug: 'organization:update', resource: 'organization', action: 'update' },
  { name: 'Delete Organization', slug: 'organization:delete', resource: 'organization', action: 'delete' },
  
  // User management
  { name: 'View Users', slug: 'users:read', resource: 'users', action: 'read' },
  { name: 'Create Users', slug: 'users:create', resource: 'users', action: 'create' },
  { name: 'Edit Users', slug: 'users:update', resource: 'users', action: 'update' },
  { name: 'Delete Users', slug: 'users:delete', resource: 'users', action: 'delete' },
  
  // Role management
  { name: 'View Roles', slug: 'roles:read', resource: 'roles', action: 'read' },
  { name: 'Create Roles', slug: 'roles:create', resource: 'roles', action: 'create' },
  { name: 'Edit Roles', slug: 'roles:update', resource: 'roles', action: 'update' },
  { name: 'Delete Roles', slug: 'roles:delete', resource: 'roles', action: 'delete' },
  
  // Settings
  { name: 'View Settings', slug: 'settings:read', resource: 'settings', action: 'read' },
  { name: 'Edit Settings', slug: 'settings:update', resource: 'settings', action: 'update' },
  
  // Dashboard
  { name: 'View Dashboard', slug: 'dashboard:read', resource: 'dashboard', action: 'read' },
  
  // Reports
  { name: 'View Reports', slug: 'reports:read', resource: 'reports', action: 'read' },
  { name: 'Export Reports', slug: 'reports:export', resource: 'reports', action: 'export' },
  
  // Chart of Accounts (future)
  { name: 'View Chart of Accounts', slug: 'coa:read', resource: 'coa', action: 'read' },
  { name: 'Create Accounts', slug: 'coa:create', resource: 'coa', action: 'create' },
  { name: 'Edit Accounts', slug: 'coa:update', resource: 'coa', action: 'update' },
  { name: 'Delete Accounts', slug: 'coa:delete', resource: 'coa', action: 'delete' },
  
  // Journal Entries (future)
  { name: 'View Journal Entries', slug: 'journal:read', resource: 'journal', action: 'read' },
  { name: 'Create Journal Entries', slug: 'journal:create', resource: 'journal', action: 'create' },
  { name: 'Edit Journal Entries', slug: 'journal:update', resource: 'journal', action: 'update' },
  { name: 'Delete Journal Entries', slug: 'journal:delete', resource: 'journal', action: 'delete' },
  { name: 'Post Journal Entries', slug: 'journal:post', resource: 'journal', action: 'post' },
  
  // Invoices (future)
  { name: 'View Invoices', slug: 'invoices:read', resource: 'invoices', action: 'read' },
  { name: 'Create Invoices', slug: 'invoices:create', resource: 'invoices', action: 'create' },
  { name: 'Edit Invoices', slug: 'invoices:update', resource: 'invoices', action: 'update' },
  { name: 'Delete Invoices', slug: 'invoices:delete', resource: 'invoices', action: 'delete' },
];

// Role-Permission mappings
const rolePermissionMappings: Record<string, string[]> = {
  super_admin: defaultPermissions.map(p => p.slug), // All permissions
  org_owner: defaultPermissions.map(p => p.slug), // All permissions within org
  admin: [
    'organization:read', 'organization:update',
    'users:read', 'users:create', 'users:update', 'users:delete',
    'roles:read', 'roles:create', 'roles:update', 'roles:delete',
    'settings:read', 'settings:update',
    'dashboard:read',
    'reports:read', 'reports:export',
    'coa:read', 'coa:create', 'coa:update', 'coa:delete',
    'journal:read', 'journal:create', 'journal:update', 'journal:delete', 'journal:post',
    'invoices:read', 'invoices:create', 'invoices:update', 'invoices:delete',
  ],
  accountant: [
    'organization:read',
    'users:read',
    'dashboard:read',
    'reports:read', 'reports:export',
    'coa:read', 'coa:create', 'coa:update',
    'journal:read', 'journal:create', 'journal:update', 'journal:post',
    'invoices:read', 'invoices:create', 'invoices:update',
  ],
  bookkeeper: [
    'organization:read',
    'dashboard:read',
    'reports:read',
    'coa:read',
    'journal:read', 'journal:create',
    'invoices:read', 'invoices:create',
  ],
  viewer: [
    'organization:read',
    'dashboard:read',
    'reports:read',
    'coa:read',
    'journal:read',
    'invoices:read',
  ],
};

export const seedDatabase = async () => {
  console.log('🌱 Seeding database...');

  try {
    // Seed roles
    console.log('Creating system roles...');
    for (const role of systemRoles) {
      const existing = await db.query.roles.findFirst({
        where: eq(roles.slug, role.slug),
      });

      if (!existing) {
        await db.insert(roles).values(role);
        console.log(`  ✓ Created role: ${role.name}`);
      } else {
        console.log(`  - Role exists: ${role.name}`);
      }
    }

    // Seed permissions
    console.log('Creating permissions...');
    for (const permission of defaultPermissions) {
      const existing = await db.query.permissions.findFirst({
        where: eq(permissions.slug, permission.slug),
      });

      if (!existing) {
        await db.insert(permissions).values(permission);
        console.log(`  ✓ Created permission: ${permission.name}`);
      }
    }

    // Seed role-permission mappings
    console.log('Creating role-permission mappings...');
    for (const [roleSlug, permissionSlugs] of Object.entries(rolePermissionMappings)) {
      const role = await db.query.roles.findFirst({
        where: eq(roles.slug, roleSlug),
      });

      if (!role) continue;

      for (const permSlug of permissionSlugs) {
        const permission = await db.query.permissions.findFirst({
          where: eq(permissions.slug, permSlug),
        });

        if (!permission) continue;

        const existingMapping = await db.query.rolePermissions.findFirst({
          where: (rp, { and, eq }) =>
            and(eq(rp.roleId, role.id), eq(rp.permissionId, permission.id)),
        });

        if (!existingMapping) {
          await db.insert(rolePermissions).values({
            roleId: role.id,
            permissionId: permission.id,
          });
        }
      }
      console.log(`  ✓ Mapped permissions for: ${roleSlug}`);
    }

    console.log('✅ Database seeding completed');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
