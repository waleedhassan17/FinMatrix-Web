import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { db, users, getUserByEmail, getUserTenants, getUserRoleInOrg, eq } from '@finmatrix/db';

// Extend the built-in types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      image: string | null;
      currentOrganizationId: string | null;
      currentOrganizationSlug: string | null;
      role: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    image: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    image: string | null;
    currentOrganizationId: string | null;
    currentOrganizationSlug: string | null;
    role: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await getUserByEmail(credentials.email);

        if (!user) {
          throw new Error('Invalid email or password');
        }

        if (!user.passwordHash) {
          throw new Error('Please use a different sign-in method');
        }

        if (!user.isActive) {
          throw new Error('Your account has been deactivated');
        }

        const isPasswordValid = await compare(credentials.password, user.passwordHash);

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        // Update last login
        await db
          .update(users)
          .set({ lastLoginAt: new Date() })
          .where(eq(users.id, user.id));

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          image: user.image,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.image = user.image;

        // Get user's first organization
        const tenants = await getUserTenants(user.id);
        if (tenants.length > 0) {
          const firstTenant = tenants[0];
          token.currentOrganizationId = firstTenant.id;
          token.currentOrganizationSlug = firstTenant.slug;

          // Get user's role in the organization
          const role = await getUserRoleInOrg(user.id, firstTenant.id);
          token.role = role?.slug || null;
        }
      }

      // Handle organization switch
      if (trigger === 'update' && session?.organizationId) {
        const tenants = await getUserTenants(token.id);
        const selectedTenant = tenants.find((t) => t.id === session.organizationId);

        if (selectedTenant) {
          token.currentOrganizationId = selectedTenant.id;
          token.currentOrganizationSlug = selectedTenant.slug;

          const role = await getUserRoleInOrg(token.id, selectedTenant.id);
          token.role = role?.slug || null;
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user = {
        id: token.id,
        email: token.email,
        firstName: token.firstName,
        lastName: token.lastName,
        image: token.image,
        currentOrganizationId: token.currentOrganizationId,
        currentOrganizationSlug: token.currentOrganizationSlug,
        role: token.role,
      };

      return session;
    },
  },

  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
    newUser: '/onboarding',
  },

  events: {
    async signOut(message) {
      // Log signout event - can be extended to update database
      console.log('User signed out:', message);
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === 'development',
};
