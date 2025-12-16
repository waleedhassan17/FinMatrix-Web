'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { UserPlus, Settings, Rocket, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Create Your Account',
    description: 'Sign up free in 30 seconds. No credit card required.',
    time: '2 minutes',
    gradient: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    number: '02',
    icon: Settings,
    title: 'Set Up Your Organization',
    description: "Add your business details and tax information. We'll auto-detect Pakistan settings.",
    time: '5 minutes',
    gradient: 'from-purple-500 to-indigo-600',
    bgColor: 'bg-purple-50',
  },
  {
    number: '03',
    icon: Rocket,
    title: 'Start Managing Finances',
    description: 'Create your first FBR-compliant invoice and generate reports instantly.',
    time: '3 minutes',
    gradient: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
  },
];

export function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section id="about" className="py-24 bg-white relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-radial from-blue-50 to-transparent rounded-full opacity-50" />

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
            Getting Started
          </motion.span>
          <motion.h2
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ delay: 0.2 }}
          >
            Start Managing Finances in 10 Minutes
          </motion.h2>
          <motion.p
            className="text-lg text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ delay: 0.3 }}
          >
            Three simple steps to transform your business accounting
          </motion.p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {steps.map((step, index) => (
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
              className="relative text-center group"
            >
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gray-200">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${step.gradient}`}
                    initial={{ scaleX: 0 }}
                    animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                    transition={{ delay: 0.5 + index * 0.3, duration: 0.8 }}
                    style={{ transformOrigin: 'left' }}
                  />
                </div>
              )}

              {/* Step number */}
              <motion.div
                className="inline-block mb-6"
                initial={{ scale: 0 }}
                animate={isInView ? { scale: 1 } : { scale: 0 }}
                transition={{ delay: 0.3 + index * 0.15, type: 'spring', stiffness: 150 }}
              >
                <span className={`text-6xl font-bold bg-gradient-to-br ${step.gradient} bg-clip-text text-transparent opacity-20`}>
                  {step.number}
                </span>
              </motion.div>

              {/* Icon */}
              <motion.div
                className="relative z-10 mx-auto mb-6"
                initial={{ scale: 0 }}
                animate={isInView ? { scale: 1 } : { scale: 0 }}
                transition={{ delay: 0.4 + index * 0.15, type: 'spring', stiffness: 200 }}
              >
                <motion.div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} shadow-lg`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <step.icon className="h-8 w-8 text-white" />
                </motion.div>
              </motion.div>

              {/* Content */}
              <motion.h3
                className="text-xl font-bold text-gray-900 mb-3"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 0.5 + index * 0.15 }}
              >
                {step.title}
              </motion.h3>
              
              <motion.p
                className="text-gray-600 mb-4"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 0.6 + index * 0.15 }}
              >
                {step.description}
              </motion.p>

              {/* Time badge */}
              <motion.span
                className={`inline-flex items-center px-3 py-1 ${step.bgColor} rounded-full text-sm text-gray-600`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                transition={{ delay: 0.7 + index * 0.15 }}
              >
                ⏱️ {step.time}
              </motion.span>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.8 }}
        >
          <Link href="/register">
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <Button
                size="lg"
                className="h-14 px-8 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 group"
              >
                Start Your Free Trial
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
