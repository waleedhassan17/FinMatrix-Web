import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Load environment variables
dotenv.config({ path: '../../.env' });

// Create a connection pool
const createPool = (connectionString: string) => {
  return new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
};

// Global pool for the main (public) schema
let globalPool: Pool | null = null;

// Get or create the global pool
export const getPool = () => {
  if (!globalPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    globalPool = createPool(connectionString);
  }
  return globalPool;
};

// Create Drizzle client for the public schema
export const db = drizzle(getPool(), { schema });

// Type for the database instance
export type Database = typeof db;

/**
 * Create a tenant-scoped database client
 * This sets the search_path to the tenant's schema for all queries
 */
export const createTenantDb = async (schemaName: string): Promise<Database> => {
  const pool = getPool();
  
  // Validate schema name to prevent SQL injection
  if (!/^[a-z][a-z0-9_]*$/.test(schemaName)) {
    throw new Error('Invalid schema name');
  }

  // Create a new client from the pool with the tenant's schema
  const client = await pool.connect();
  
  try {
    // Set the search_path to the tenant's schema, falling back to public
    await client.query(`SET search_path TO "${schemaName}", public`);
    
    // Create a new drizzle instance with this client
    // Note: In production, you'd want to manage this connection more carefully
    return drizzle(client as any, { schema });
  } catch (error) {
    client.release();
    throw error;
  }
};

/**
 * Execute a function within a tenant context
 * Automatically handles schema switching and cleanup
 */
export const withTenantDb = async <T>(
  schemaName: string,
  fn: (db: Database) => Promise<T>
): Promise<T> => {
  const pool = getPool();
  const client = await pool.connect();

  try {
    // Validate schema name
    if (!/^[a-z][a-z0-9_]*$/.test(schemaName)) {
      throw new Error('Invalid schema name');
    }

    // Set the search_path
    await client.query(`SET search_path TO "${schemaName}", public`);
    
    // Create tenant-scoped db instance
    const tenantDb = drizzle(client as any, { schema });
    
    // Execute the function
    return await fn(tenantDb);
  } finally {
    // Reset search_path and release client
    await client.query('SET search_path TO public');
    client.release();
  }
};

/**
 * Create a new schema for a tenant
 */
export const createTenantSchema = async (schemaName: string): Promise<void> => {
  const pool = getPool();
  const client = await pool.connect();

  try {
    // Validate schema name
    if (!/^[a-z][a-z0-9_]*$/.test(schemaName)) {
      throw new Error('Invalid schema name');
    }

    // Create the schema
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

    // Set search path to the new schema
    await client.query(`SET search_path TO "${schemaName}"`);

    // Run migrations for the tenant schema
    // In production, you'd want to run the same migrations as the public schema
    // For now, we'll create the basic tables needed for tenant data
    await createTenantTables(client);

  } finally {
    await client.query('SET search_path TO public');
    client.release();
  }
};

/**
 * Create tenant-specific tables
 * These are tables that exist within each tenant's schema
 */
const createTenantTables = async (client: any): Promise<void> => {
  // Note: In a production setup, you'd want to use proper migrations
  // This is a simplified version for the MVP
  
  // Future tables will go here (Chart of Accounts, Journal Entries, etc.)
  // For now, we just ensure the schema exists
};

/**
 * Delete a tenant schema (use with caution!)
 */
export const deleteTenantSchema = async (schemaName: string): Promise<void> => {
  const pool = getPool();
  const client = await pool.connect();

  try {
    // Validate schema name
    if (!/^[a-z][a-z0-9_]*$/.test(schemaName)) {
      throw new Error('Invalid schema name');
    }

    // Drop the schema and all its contents
    await client.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
  } finally {
    client.release();
  }
};

// Export schema for use in other packages
export * from './schema';
