import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@finmatrix/auth';
import { db, users, eq } from '@finmatrix/db';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (session?.user?.id) {
      // Update user's last activity timestamp (optional: track logout)
      await db
        .update(users)
        .set({ 
          updatedAt: new Date(),
        })
        .where(eq(users.id, session.user.id));
    }

    // Clear all auth-related cookies
    const cookieStore = cookies();
    
    // Clear NextAuth session cookies
    cookieStore.delete('next-auth.session-token');
    cookieStore.delete('next-auth.csrf-token');
    cookieStore.delete('next-auth.callback-url');
    
    // For secure cookies (production)
    cookieStore.delete('__Secure-next-auth.session-token');
    cookieStore.delete('__Secure-next-auth.csrf-token');
    cookieStore.delete('__Secure-next-auth.callback-url');
    
    // For host cookies
    cookieStore.delete('__Host-next-auth.csrf-token');

    return NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}
