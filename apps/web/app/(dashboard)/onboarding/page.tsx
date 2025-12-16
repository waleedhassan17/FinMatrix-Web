import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@finmatrix/auth';
import { getUserTenants } from '@finmatrix/db';
import { OnboardingForm } from '@/components/onboarding/onboarding-form';
import { LogoutButton } from '@/components/auth/logout-button';
import { BarChart3, Building2, Shield, Zap } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Setup Your Organization | FinMatrix',
  description: 'Create your organization to get started with FinMatrix',
};

const steps = [
  {
    icon: Building2,
    title: 'Create Organization',
    description: 'Set up your company profile',
  },
  {
    icon: Shield,
    title: 'Tax Compliance',
    description: 'Add NTN & STRN details',
  },
  {
    icon: Zap,
    title: 'Start Using',
    description: 'Begin managing finances',
  },
];

export default async function OnboardingPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Check if user already has organizations
  const userOrgs = await getUserTenants(session.user.id);
  
  if (userOrgs.length > 0) {
    // User already has orgs, redirect to dashboard
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-300 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">FinMatrix</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Let's Get You Started! 🚀
            </h1>
            <p className="text-blue-100 text-lg">
              Just a few quick steps to set up your organization and start managing your finances like a pro.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center gap-4 bg-white/10 backdrop-blur rounded-xl p-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${index === 0 ? 'bg-white text-blue-600' : 'bg-white/20 text-white'}`}>
                  {index === 0 ? (
                    <span className="font-bold">1</span>
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-white">{step.title}</p>
                  <p className="text-blue-200 text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-blue-200 text-sm">
            Need help? Contact us at waleedhassansfd@gmail.com
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Header with Logout */}
        <div className="flex justify-between items-center p-6">
          <div className="lg:hidden flex items-center space-x-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              FinMatrix
            </span>
          </div>
          <div className="ml-auto">
            <LogoutButton 
              variant="outline" 
              className="text-gray-600 border-gray-300 hover:bg-gray-100"
            />
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-lg">
            {/* Welcome Message */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-4">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome, {session.user.firstName || 'there'}! 👋
              </h1>
              <p className="text-gray-600">
                Create your organization to get started with FBR-compliant accounting
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 relative z-10">
              <OnboardingForm userId={session.user.id} />
            </div>

            {/* Help Text */}
            <p className="text-center text-sm text-gray-500 mt-6">
              You can update these settings later from your organization settings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
