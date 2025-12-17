'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Shield, Sparkles, Cloud, CheckCircle } from 'lucide-react';

const valueProps = [
  {
    icon: Shield,
    title: 'Guaranteed FBR Compliance',
    description:
      'Automatic FBR-compliant invoices, GST calculations, and monthly tax reports. Never worry about tax compliance again.',
    features: [
      'Auto GST calculation (17%)',
      'FBR invoice format',
      'Monthly tax reports',
      'NTN validation',
    ],
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-50 to-cyan-50',
  },
  {
    icon: Sparkles,
    title: '40% Cheaper, More Features',
    description:
      "Get premium features at local pricing. Storage-based plans that grow with your business—no per-user fees.",
    features: [
      'FinMatrix: PKR 7,999/mo',
      'QuickBooks: PKR 28,000/mo',
      'Save PKR 20,000/mo',
      'No per-user fees',
    ],
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-50 to-pink-50',
    highlight: true,
  },
  {
    icon: Cloud,
    title: 'Access Anywhere, Anytime',
    description:
      'Modern cloud platform with mobile-first design. Real-time sync across all devices with bank-grade security.',
    features: [
      '100GB-500GB storage',
      'Unlimited users (Professional)',
      'Mobile apps (iOS/Android)',
      'Real-time collaboration',
    ],
    gradient: 'from-emerald-500 to-teal-500',
    bgGradient: 'from-emerald-50 to-teal-50',
  },
];

export function ValueProps() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section id="features" className="py-24 bg-white relative overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-50 to-purple-50 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-20 left-0 w-[400px] h-[400px] bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-full blur-3xl opacity-50" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span
            className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ delay: 0.1 }}
          >
            Why Choose Us
          </motion.span>
          <motion.h2
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ delay: 0.2 }}
          >
            Why Pakistani SMBs Choose FinMatrix
          </motion.h2>
          <motion.p
            className="text-lg text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ delay: 0.3 }}
          >
            The only accounting software built specifically for Pakistan's tax system
          </motion.p>
        </motion.div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {valueProps.map((prop, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{
                delay: 0.2 + index * 0.15,
                type: 'spring',
                stiffness: 80,
                damping: 20,
              }}
              whileHover={{ y: -8 }}
              className={`group relative ${prop.highlight ? 'md:-mt-4 md:mb-4' : ''}`}
            >
              {/* Highlight glow */}
              {prop.highlight && (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-3xl blur-xl" />
              )}

              <div className={`relative h-full bg-gradient-to-br ${prop.bgGradient} rounded-2xl p-5 sm:p-8 border ${prop.highlight ? 'border-purple-200 shadow-xl' : 'border-gray-100 shadow-sm'} hover:shadow-xl transition-all duration-300`}>
                {/* Icon */}
                <motion.div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${prop.gradient} flex items-center justify-center mb-6 shadow-lg`}
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <prop.icon className="h-7 w-7 text-white" />
                </motion.div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">{prop.title}</h3>

                {/* Description */}
                <p className="text-gray-600 mb-6 leading-relaxed">{prop.description}</p>

                {/* Features */}
                <ul className="space-y-3">
                  {prop.features.map((feature, featureIndex) => (
                    <motion.li
                      key={featureIndex}
                      initial={{ opacity: 0, x: -10 }}
                      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                      transition={{ delay: 0.4 + index * 0.1 + featureIndex * 0.05 }}
                      className="flex items-center gap-3 text-sm text-gray-700"
                    >
                      <CheckCircle className={`h-4 w-4 flex-shrink-0 ${prop.highlight ? 'text-purple-500' : 'text-green-500'}`} />
                      <span>{feature}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
