'use client';

import { ReactNode, useEffect } from 'react';
import { motion } from 'framer-motion';

interface LandingWrapperProps {
  children: ReactNode;
}

export function LandingWrapper({ children }: LandingWrapperProps) {
  useEffect(() => {
    // Enable smooth scrolling
    document.documentElement.style.scrollBehavior = 'smooth';
    
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
