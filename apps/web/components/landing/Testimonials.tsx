'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    quote:
      'FinMatrix has transformed how we handle accounting. FBR compliance is automatic, and we\'ve saved PKR 50,000 monthly compared to QuickBooks.',
    name: 'Ahmed Khan',
    title: 'CEO, TechStart Solutions',
    company: 'Retail • 25 employees',
    avatar: 'AK',
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    quote:
      'As an accountant, I recommend FinMatrix to all my SMB clients. The FBR integration saves hours of manual work every month.',
    name: 'Sarah Ali',
    title: 'Chartered Accountant',
    company: 'Accounting Firm',
    avatar: 'SA',
    gradient: 'from-purple-500 to-indigo-600',
  },
  {
    quote:
      'Finally, accounting software that understands Pakistani tax laws. The dashboard is intuitive and the mobile app is a game-changer.',
    name: 'Usman Tariq',
    title: 'Finance Manager',
    company: 'Manufacturing • 40 employees',
    avatar: 'UT',
    gradient: 'from-emerald-500 to-teal-600',
  },
];

export function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100/30 rounded-full blur-3xl" />

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
            Customer Stories
          </motion.span>
          <motion.h2
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ delay: 0.2 }}
          >
            Loved by Pakistani Businesses
          </motion.h2>
          <motion.p
            className="text-lg text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ delay: 0.3 }}
          >
            See what our customers are saying about FinMatrix
          </motion.p>
        </motion.div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((testimonial, index) => (
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
              className="group"
            >
              <div className="relative bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-gray-100 h-full hover:shadow-xl transition-shadow duration-300">
                {/* Quote icon */}
                <Quote className="absolute top-6 right-6 h-10 w-10 text-gray-100" />

                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 + i * 0.05 }}
                    >
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    </motion.div>
                  ))}
                </div>

                {/* Quote */}
                <p className="text-gray-700 mb-6 leading-relaxed relative z-10">
                  "{testimonial.quote}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <motion.div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-semibold shadow-lg`}
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    {testimonial.avatar}
                  </motion.div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.title}</p>
                  </div>
                </div>

                {/* Company */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full inline-flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-400 mr-2" />
                    {testimonial.company}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
