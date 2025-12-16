import * as dotenv from 'dotenv';
import { db } from './client';
import { users, organizations, organizationMembers, userRoles, sessions, accounts } from './schema';

// Load environment variables
dotenv.config({ path: '../../.env' });

async function clearUserData() {
  console.log('🗑️  Clearing all user data...\n');

  try {
    // Delete in correct order due to foreign key constraints
    console.log('Deleting user roles...');
    await db.delete(userRoles);
    
    console.log('Deleting organization members...');
    await db.delete(organizationMembers);
    
    console.log('Deleting organizations...');
    await db.delete(organizations);
    
    console.log('Deleting sessions...');
    await db.delete(sessions);
    
    console.log('Deleting accounts...');
    await db.delete(accounts);
    
    console.log('Deleting users...');
    await db.delete(users);

    console.log('\n✅ All user data cleared successfully!');
    console.log('\nYou can now:');
    console.log('1. Register a new account -> will go to onboarding');
    console.log('2. Create organization in onboarding -> will go to dashboard');
    console.log('3. Login with existing account -> will go to dashboard');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  }

  process.exit(0);
}

clearUserData();
