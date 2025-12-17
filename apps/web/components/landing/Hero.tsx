'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import {
  Shield,
  TrendingDown,
  Lock,
  CheckCircle,
  FileText,
  BarChart3,
  Receipt,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const floatingCards = [
  {
    icon: CheckCircle,
    text: 'Invoice #1234 Paid',
    color: 'bg-green-50 text-green-600 border-green-200',
    position: 'top-20 -right-4',
    delay: 0.8,
  },
  {
    icon: BarChart3,
    text: 'PKR 2.4M Revenue',
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    position: 'top-40 -left-8',
    delay: 1.0,
  },
  {
    icon: FileText,
    text: 'Tax Reports Ready',
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    position: 'bottom-32 -right-6',
    delay: 1.2,
  },
  {
    icon: Shield,
    text: 'FBR Compliant',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    position: 'bottom-16 -left-4',
    delay: 1.4,
  },
];

// Smooth animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 80,
      damping: 20,
    },
  },
};

const dashboardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 60,
      damping: 20,
      delay: 0.3,
    },
  },
};

const floatingCardVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: (delay: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
      delay,
    },
  }),
};

export function Hero() {
  const { scrollY } = useScroll();
  
  // Smooth parallax effects
  const y1 = useTransform(scrollY, [0, 800], [0, -150]);
  const y2 = useTransform(scrollY, [0, 800], [0, -80]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  
  // Smooth spring values for parallax
  const smoothY1 = useSpring(y1, { stiffness: 50, damping: 30 });
  const smoothY2 = useSpring(y2, { stiffness: 50, damping: 30 });
  const smoothOpacity = useSpring(opacity, { stiffness: 50, damping: 30 });

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* Subtle animated background gradients */}
      <motion.div
        style={{ y: smoothY1 }}
        className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"
      />
      <motion.div
        style={{ y: smoothY2 }}
        className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-indigo-200/30 to-pink-200/20 rounded-full blur-3xl"
      />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <motion.div
        style={{ opacity: smoothOpacity }}
        className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16"
      >
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Side - Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm border border-blue-100 rounded-full text-sm font-medium text-blue-700 shadow-sm"
            >
              <span className="mr-2">🇵🇰</span>
              Made for Pakistani Businesses
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight"
            >
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Cloud Accounting
              </span>
              <br />
              <span className="text-gray-900">
                Built for Pakistan
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg md:text-xl text-gray-600 max-w-xl leading-relaxed"
            >
              FBR-compliant accounting software that saves you{' '}
              <span className="text-blue-600 font-semibold">40%</span>{' '}
              while keeping you{' '}
              <span className="text-green-600 font-semibold">100%</span>{' '}
              tax-ready. Join 500+ growing SMBs managing finances smarter.
            </motion.p>

            {/* Feature Pills */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap gap-3"
            >
              <motion.div
                className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-700 shadow-sm border border-gray-100"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">FBR Compliant</span>
              </motion.div>
              <motion.div
                className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-700 shadow-sm border border-gray-100"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <TrendingDown className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">40% Cheaper</span>
              </motion.div>
              <motion.div
                className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-700 shadow-sm border border-gray-100"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Lock className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Bank-Grade Security</span>
              </motion.div>
            </motion.div>

            {/* CTAs */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 pt-2"
            >
              <Button
                size="lg"
                className="w-full sm:w-auto h-14 px-8 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all duration-300 group"
                asChild
              >
                <Link href="/register">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-14 px-8 text-base font-semibold border-2 border-gray-200 text-gray-700 hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-300"
                asChild
              >
                <Link href="/login">
                  Sign In
                </Link>
              </Button>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center gap-6 pt-4 text-sm text-gray-500"
            >
              {[
                { icon: Lock, text: 'SSL Secured' },
                { icon: Shield, text: 'Bank-Grade Encryption' },
                { icon: CheckCircle, text: 'GDPR Compliant' },
              ].map((badge, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <badge.icon className="h-4 w-4" />
                  <span>{badge.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Side - Dashboard Mockup */}
          <motion.div
            variants={dashboardVariants}
            initial="hidden"
            animate="visible"
            className="relative lg:pl-8 hidden md:block"
          >
            {/* Main Dashboard Card */}
            <motion.div
              className="relative bg-white rounded-2xl shadow-2xl shadow-gray-200/50 border border-gray-100 p-6 overflow-hidden"
              whileHover={{
                y: -8,
                boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.15)',
              }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            >
              {/* Subtle shine effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />

              {/* Dashboard Header */}
              <motion.div
                className="flex items-center justify-between mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Financial Dashboard</h3>
                  <p className="text-sm text-gray-500">December 2024</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  FBR Compliant
                </span>
              </motion.div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
                <motion.div
                  className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <p className="text-sm text-blue-600 font-medium">Revenue</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-700 mt-1">PKR 2.4M</p>
                  <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                    <span className="text-green-500">↑</span>
                    12% from last month
                  </p>
                </motion.div>
                <motion.div
                  className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <p className="text-sm text-purple-600 font-medium">Expenses</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-700 mt-1">PKR 890K</p>
                  <p className="text-xs text-purple-500 mt-1 flex items-center gap-1">
                    <span className="text-green-500">↓</span>
                    5% from last month
                  </p>
                </motion.div>
              </div>

              {/* Invoice Preview */}
              <motion.div
                className="bg-gray-50 rounded-xl p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Recent Invoices</span>
                  <Receipt className="h-4 w-4 text-gray-400" />
                </div>
                <div className="space-y-2">
                  {[
                    { id: 'INV-001', client: 'TechCorp Ltd', amount: 'PKR 125,000', status: 'Paid' },
                    { id: 'INV-002', client: 'StartUp Inc', amount: 'PKR 85,000', status: 'Pending' },
                  ].map((invoice, idx) => (
                    <motion.div
                      key={invoice.id}
                      className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-100"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 + idx * 0.1, duration: 0.4 }}
                      whileHover={{ x: 4, backgroundColor: '#fafafa' }}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{invoice.id}</p>
                        <p className="text-xs text-gray-500">{invoice.client}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{invoice.amount}</p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            invoice.status === 'Paid'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Floating Cards - Simplified with subtle float animation */}
            {floatingCards.map((card, index) => (
              <motion.div
                key={index}
                custom={card.delay}
                variants={floatingCardVariants}
                initial="hidden"
                animate="visible"
                className={`absolute ${card.position} hidden lg:flex`}
              >
                <motion.div
                  animate={{
                    y: [0, -6, 0],
                  }}
                  transition={{
                    duration: 4 + index * 0.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  whileHover={{ scale: 1.05 }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border shadow-lg bg-white/90 backdrop-blur-sm ${card.color}`}
                >
                  <card.icon className="h-4 w-4" />
                  <span className="text-sm font-medium whitespace-nowrap">{card.text}</span>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

    </section>
  );
}
