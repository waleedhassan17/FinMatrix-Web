import { redirect } from 'next/navigation';
import { getSession } from '@finmatrix/auth';
import { TooltipProvider } from '@finmatrix/ui';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const session = await getSession();

    if (!session?.user) {
      redirect('/login');
    }
  } catch (error) {
    console.error('Session check failed:', error);
    redirect('/login');
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50">
        {children}
      </div>
    </TooltipProvider>
  );
}
