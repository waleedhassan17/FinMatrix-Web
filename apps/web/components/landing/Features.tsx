'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    title: 'Create FBR-Compliant Invoices in Seconds',
    description:
      'Professional invoices with automatic GST calculation, NTN validation, and FBR-approved formatting. Track payments and send automated reminders.',
    features: [
      'FBR-compliant invoice templates',
      'Automatic tax calculations',
      'Payment tracking & reminders',
      'PDF & email delivery',
    ],
    imagePosition: 'left',
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-50 to-cyan-50/50',
  },
  {
    title: 'Real-Time Financial Insights',
    description:
      'See your complete financial picture at a glance. Track revenue, expenses, cash flow, and tax obligations in real-time.',
    features: [
      'Live financial dashboard',
      'Income & expense tracking',
      'Cash flow monitoring',
      'Tax obligation calculator',
    ],
    imagePosition: 'right',
    gradient: 'from-purple-500 to-indigo-500',
    bgGradient: 'from-purple-50 to-indigo-50/50',
  },
  {
    title: 'Automated Bank Reconciliation',
    description:
      'Import bank statements and match transactions automatically. Save hours of manual data entry every month.',
    features: [
      'CSV import & API integration',
      'Auto transaction matching',
      'Multi-bank support',
      'Outstanding check tracking',
    ],
    imagePosition: 'left',
    gradient: 'from-emerald-500 to-teal-500',
    bgGradient: 'from-emerald-50 to-teal-50/50',
  },
];

function FeatureImage({ gradient, title, isInView }: { gradient: string; title: string; isInView: boolean }) {
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      <motion.div
        className="relative bg-white rounded-2xl shadow-xl border border-gray-100 p-6 overflow-hidden"
        whileHover={{ y: -4, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.12)' }}
        transition={{ duration: 0.3 }}
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-2 mb-4">
          {['bg-red-400', 'bg-yellow-400', 'bg-green-400'].map((bg, i) => (
            <motion.div
              key={i}
              className={`w-3 h-3 rounded-full ${bg}`}
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : { scale: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            />
          ))}
          <motion.span
            className="ml-4 text-xs text-gray-400"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.5 }}
          >
            {title}
          </motion.span>
        </div>

        {/* Mock interface */}
        <div className="space-y-4">
          <motion.div
            className="h-8 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg"
            initial={{ width: 0 }}
            animate={isInView ? { width: '75%' } : { width: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          />
          
          <div className="grid grid-cols-3 gap-3">
            {[0.3, 0.4, 0.3].map((opacity, i) => (
              <motion.div
                key={i}
                className={`h-20 bg-gradient-to-br ${gradient} rounded-xl`}
                style={{ opacity }}
                initial={{ scale: 0 }}
                animate={isInView ? { scale: 1 } : { scale: 0 }}
                transition={{ delay: 0.5 + i * 0.1, type: 'spring', stiffness: 150, damping: 15 }}
              />
            ))}
          </div>
          
          <div className="space-y-2">
            {[100, 83, 66].map((width, i) => (
              <motion.div
                key={i}
                className="h-4 bg-gray-100 rounded"
                initial={{ width: 0 }}
                animate={isInView ? { width: `${width}%` } : { width: 0 }}
                transition={{ delay: 0.7 + i * 0.1, duration: 0.4 }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function FeatureBlock({ feature, index }: { feature: (typeof features)[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const isImageLeft = feature.imagePosition === 'left';

  return (
    <motion.div
      ref={ref}
      className={`py-20 ${index % 2 === 0 ? 'bg-white' : `bg-gradient-to-br ${feature.bgGradient}`}`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: isImageLeft ? -30 : 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: isImageLeft ? -30 : 30 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className={isImageLeft ? '' : 'lg:order-2'}
          >
            <FeatureImage gradient={feature.gradient} title={feature.title} isInView={isInView} />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: isImageLeft ? 30 : -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: isImageLeft ? 30 : -30 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
            className={`space-y-6 ${isImageLeft ? '' : 'lg:order-1'}`}
          >
            <motion.h3
              className="text-2xl sm:text-3xl font-bold text-gray-900"
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ delay: 0.2 }}
            >
              {feature.title}
            </motion.h3>
            
            <motion.p
              className="text-lg text-gray-600 leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ delay: 0.3 }}
            >
              {feature.description}
            </motion.p>

            <ul className="space-y-3">
              {feature.features.map((item, itemIndex) => (
                <motion.li
                  key={itemIndex}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                  transition={{ delay: 0.4 + itemIndex * 0.08 }}
                >
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </motion.li>
              ))}
            </ul>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ delay: 0.7 }}
            >
              <motion.div
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Button
                  variant="outline"
                  className="group border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-colors"
                >
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export function Features() {
  return (
    <section className="relative">
      {features.map((feature, index) => (
        <FeatureBlock key={index} feature={feature} index={index} />
      ))}
    </section>
  );
}
