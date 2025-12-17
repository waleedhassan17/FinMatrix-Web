import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL || '';

export default {
  schema: './src/schema/index.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: isProduction 
      ? `${connectionString}?sslmode=require` 
      : connectionString,
  },
  verbose: true,
  strict: true,
} satisfies Config;
