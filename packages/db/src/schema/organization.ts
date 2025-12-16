import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizationMembers } from './user';

export const organizations = pgTable(
  'organizations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    // Schema name for multi-tenancy (schema-per-tenant approach)
    schemaName: varchar('schema_name', { length: 63 }).notNull().unique(),
    
    // Business Information
    businessType: varchar('business_type', { length: 50 }),
    registrationNumber: varchar('registration_number', { length: 100 }),
    ntn: varchar('ntn', { length: 50 }), // National Tax Number (Pakistan)
    strn: varchar('strn', { length: 50 }), // Sales Tax Registration Number
    
    // Contact Information
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 20 }),
    website: varchar('website', { length: 255 }),
    
    // Address
    address: text('address'),
    city: varchar('city', { length: 100 }),
    state: varchar('state', { length: 100 }),
    postalCode: varchar('postal_code', { length: 20 }),
    country: varchar('country', { length: 100 }).default('Pakistan'),
    
    // Settings (stored as JSONB for flexibility)
    settings: jsonb('settings').$type<OrganizationSettings>().default({}),
    
    // Logo and Branding
    logo: text('logo'),
    
    // Status
    isActive: boolean('is_active').default(true).notNull(),
    
    // Timestamps
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: index('organizations_slug_idx').on(table.slug),
    schemaIdx: index('organizations_schema_idx').on(table.schemaName),
    activeIdx: index('organizations_active_idx').on(table.isActive),
  })
);

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
}));

// Organization Settings Interface
export interface OrganizationSettings {
  fiscalYearStart?: number; // Month (1-12)
  currency?: string;
  timezone?: string;
  dateFormat?: string;
  invoicePrefix?: string;
  invoiceStartNumber?: number;
  enableGst?: boolean;
  gstRate?: number;
}

// Type exports
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
