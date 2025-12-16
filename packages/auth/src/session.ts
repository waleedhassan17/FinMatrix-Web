import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from './config';

export type SessionUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  image: string | null;
  currentOrganizationId: string | null;
  currentOrganizationSlug: string | null;
  role: string | null;
};

export type Session = {
  user: SessionUser;
  expires: string;
};

/**
 * Get the current session on the server
 */
export const getSession = async (): Promise<Session | null> => {
  const session = await getServerSession(authOptions);
  return session as Session | null;
};

/**
 * Get the current session user
 * Returns null if not authenticated
 */
export const getCurrentUser = async (): Promise<SessionUser | null> => {
  const session = await getSession();
  return session?.user || null;
};

/**
 * Require authentication - redirects to login if not authenticated
 */
export const requireAuth = async (): Promise<Session> => {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  return session;
};

/**
 * Require user to be in an organization - redirects to onboarding if not
 */
export const requireOrganization = async (): Promise<Session & { user: SessionUser & { currentOrganizationId: string } }> => {
  const session = await requireAuth();

  if (!session.user.currentOrganizationId) {
    redirect('/onboarding');
  }

  return session as Session & { user: SessionUser & { currentOrganizationId: string } };
};

/**
 * Get organization ID from session
 * Throws if not in an organization context
 */
export const getOrganizationId = async (): Promise<string> => {
  const session = await requireOrganization();
  return session.user.currentOrganizationId;
};

/**
 * Get organization slug from session
 */
export const getOrganizationSlug = async (): Promise<string | null> => {
  const session = await getSession();
  return session?.user.currentOrganizationSlug || null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const session = await getSession();
  return !!session;
};

/**
 * Check if user belongs to an organization
 */
export const isInOrganization = async (): Promise<boolean> => {
  const session = await getSession();
  return !!session?.user.currentOrganizationId;
};
