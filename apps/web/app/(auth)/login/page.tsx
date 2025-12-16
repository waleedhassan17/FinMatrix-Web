import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Sign In | FinMatrix',
  description: 'Sign in to your FinMatrix account',
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Home
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
        <p className="text-gray-500">Sign in to access your account</p>
      </div>

      {/* Form */}
      <LoginForm />

      {/* Sign Up Link */}
      <p className="text-center text-sm text-gray-500">
        Don't have an account?{' '}
        <Link href="/register" className="text-blue-600 hover:underline font-medium">
          Start free trial →
        </Link>
      </p>
    </div>
  );
}
