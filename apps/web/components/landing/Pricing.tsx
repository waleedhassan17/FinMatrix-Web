'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const plans = [
  {
    name: 'Starter',
    badge: 'Most Popular',
    price: '7,999',
    storage: '100GB',
    users: 'Up to 5',
    features: [
      'General Ledger',
      'Invoicing & AR',
      'FBR Compliance',
      'Bank Reconciliation',
      'Financial Reports',
      '5 Users',
    ],
    cta: 'Start Free Trial',
    featured: false,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Professional',
    badge: 'Best Value',
    price: '14,999',
    storage: '500GB',
    users: 'Unlimited',
    features: [
      'Everything in Starter',
      'Advanced Reporting',
      'Multi-Company',
      'Priority Support',
      'Unlimited Users',
      'API Access',
    ],
    cta: 'Start Free Trial',
    featured: true,
    gradient: 'from-purple-500 to-indigo-500',
  },
  {
    name: 'Enterprise',
    badge: null,
    price: 'Custom',
    storage: 'Unlimited',
    users: 'Unlimited',
    features: [
      'Everything in Professional',
      'Dedicated Account Manager',
      'Custom Integrations',
      'Advanced Security',
      'SLA Guarantee',
      'Training & Onboarding',
    ],
    cta: 'Contact Sales',
    featured: false,
    gradient: 'from-emerald-500 to-teal-500',
  },
];

function PricingCard({ plan, index, isInView }: { plan: (typeof plans)[0]; index: number; isInView: boolean }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{
        delay: 0.1 + index * 0.15,
        type: 'spring',
        stiffness: 80,
        damping: 20,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative ${plan.featured ? 'lg:-mt-4 lg:mb-4 z-10' : ''}`}
    >
      {/* Featured glow effect */}
      {plan.featured && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-3xl blur-xl"
          animate={{ opacity: isHovered ? 0.4 : 0.2 }}
          transition={{ duration: 0.3 }}
        />
      )}

      <motion.div
        className={`relative bg-white rounded-2xl p-8 h-full flex flex-col ${
          plan.featured
            ? 'border-2 border-purple-500 shadow-xl'
            : 'border border-gray-200 shadow-sm'
        }`}
        whileHover={{ y: plan.featured ? -8 : -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Badge */}
        {plan.badge && (
          <motion.div
            className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-medium ${
              plan.featured
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
            initial={{ y: -10, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : { y: -10, opacity: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
          >
            {plan.featured && <Sparkles className="h-3 w-3 inline mr-1" />}
            {plan.badge}
          </motion.div>
        )}

        {/* Plan Name */}
        <h3 className="text-xl font-bold text-gray-900 mt-4">{plan.name}</h3>

        {/* Price */}
        <div className="mt-4 mb-6">
          {plan.price === 'Custom' ? (
            <span className="text-3xl font-bold text-gray-900">Custom</span>
          ) : (
            <>
              <span className="text-sm text-gray-500">PKR</span>
              <span className="text-4xl font-bold text-gray-900 ml-1">{plan.price}</span>
              <span className="text-gray-500">/month</span>
            </>
          )}
        </div>

        {/* Storage & Users */}
        <div className="flex items-center justify-between text-sm text-gray-600 pb-6 border-b border-gray-100">
          <span>Storage: {plan.storage}</span>
          <span>Users: {plan.users}</span>
        </div>

        {/* Features */}
        <ul className="space-y-3 my-6 flex-grow">
          {plan.features.map((feature, featureIndex) => (
            <motion.li
              key={featureIndex}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
              transition={{ delay: 0.5 + index * 0.1 + featureIndex * 0.05 }}
            >
              <CheckCircle className={`h-5 w-5 flex-shrink-0 ${plan.featured ? 'text-purple-500' : 'text-green-500'}`} />
              <span className="text-gray-700 text-sm">{feature}</span>
            </motion.li>
          ))}
        </ul>

        {/* CTA */}
        <Button
          className={`w-full h-12 font-semibold ${
            plan.featured
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/25'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
          asChild
        >
          <Link href={plan.cta === 'Contact Sales' ? '#contact' : '/register'}>
            {plan.cta}
          </Link>
        </Button>
      </motion.div>
    </motion.div>
  );
}

export function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section id="pricing" className="py-24 bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span
            className="inline-block px-4 py-1.5 bg-purple-50 text-purple-600 rounded-full text-sm font-medium mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ delay: 0.1 }}
          >
            Simple Pricing
          </motion.span>
          <motion.h2
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ delay: 0.2 }}
          >
            Transparent Pricing for Every Business Size
          </motion.h2>
          <motion.p
            className="text-lg text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ delay: 0.3 }}
          >
            Start free, upgrade as you grow. No hidden fees, no surprises.
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <PricingCard key={index} plan={plan} index={index} isInView={isInView} />
          ))}
        </div>

        {/* Trust Line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-12 space-y-4"
        >
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            {['14-day free trial', 'No credit card required', 'Cancel anytime'].map((item, i) => (
              <motion.span
                key={i}
                className="flex items-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ delay: 0.9 + i * 0.1 }}
              >
                <CheckCircle className="h-4 w-4 text-green-500" />
                {item}
              </motion.span>
            ))}
          </div>
          
          <motion.div
            className="inline-flex items-center px-4 py-2 bg-green-50 border border-green-200 rounded-full text-sm font-medium text-green-700"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ delay: 1.1 }}
            whileHover={{ scale: 1.02 }}
          >
            💰 Save 20% with annual billing
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
