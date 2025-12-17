'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useInView, useSpring, useMotionValue } from 'framer-motion';
import { Users, DollarSign, Clock, Shield } from 'lucide-react';

const stats = [
  {
    icon: Users,
    value: 500,
    suffix: '+',
    label: 'Active Users',
    gradient: 'from-blue-500 to-blue-600',
    bgGradient: 'from-blue-50 to-blue-100/50',
  },
  {
    icon: DollarSign,
    value: 2.4,
    suffix: 'B+',
    prefix: 'PKR ',
    label: 'Managed Monthly',
    gradient: 'from-green-500 to-emerald-600',
    bgGradient: 'from-green-50 to-emerald-100/50',
  },
  {
    icon: Clock,
    value: 99.9,
    suffix: '%',
    label: 'Uptime',
    gradient: 'from-purple-500 to-indigo-600',
    bgGradient: 'from-purple-50 to-indigo-100/50',
  },
  {
    icon: Shield,
    value: 100,
    suffix: '%',
    label: 'FBR Compliant',
    gradient: 'from-emerald-500 to-teal-600',
    bgGradient: 'from-emerald-50 to-teal-100/50',
  },
];

// Animated counter with spring physics
function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
  inView,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  inView: boolean;
}) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 40,
    damping: 25,
  });
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    if (inView) {
      motionValue.set(value);
    }
  }, [inView, motionValue, value]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      const formatted = value < 10 ? latest.toFixed(1) : Math.round(latest).toString();
      setDisplayValue(formatted);
    });
    return unsubscribe;
  }, [springValue, value]);

  return (
    <span>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}

export function TrustSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50/50 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100/20 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.span
            className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ delay: 0.1 }}
          >
            Trusted by Pakistani Businesses
          </motion.span>
          <motion.h2
            className="text-3xl sm:text-4xl font-bold text-gray-900"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ delay: 0.2 }}
          >
            Growing with Our Community
          </motion.h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.95 }}
              transition={{
                delay: 0.1 + index * 0.1,
                type: 'spring',
                stiffness: 80,
                damping: 20,
              }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group"
            >
              <div className={`relative bg-gradient-to-br ${stat.bgGradient} rounded-2xl p-4 sm:p-6 h-full border border-white/50 shadow-sm hover:shadow-lg transition-all duration-300`}>
                {/* Icon */}
                <motion.div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-3 sm:mb-4 shadow-lg`}
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <stat.icon className="h-6 w-6 text-white" />
                </motion.div>

                {/* Value */}
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                  <AnimatedCounter
                    value={stat.value}
                    suffix={stat.suffix}
                    prefix={stat.prefix}
                    inView={isInView}
                  />
                </div>

                {/* Label */}
                <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust logos placeholder */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-gray-500 mb-6">Trusted by leading Pakistani companies</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-40">
            {['TechCorp', 'StartUp Inc', 'Finance Pro', 'Growth Co', 'Enterprise Ltd'].map((company, index) => (
              <motion.div
                key={company}
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="text-xl font-bold text-gray-400"
              >
                {company}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
