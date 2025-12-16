import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@finmatrix/auth';
import { getUserTenants } from '@finmatrix/db';
import DashboardContent from '@/components/dashboard/dashboard-content';

export const metadata: Metadata = {
  title: 'Dashboard | FinMatrix',
  description: 'Your FinMatrix dashboard - Pakistani SMB accounting software',
};

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Check if user has any organizations
  const userOrgs = await getUserTenants(session.user.id);
  
  if (userOrgs.length === 0) {
    redirect('/onboarding');
  }

  return <DashboardContent />;
}
