'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { BarChart3, Facebook, Linkedin, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

const footerLinks = {
  product: [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'FBR Compliance', href: '#' },
    { name: 'Security', href: '#' },
    { name: 'API Documentation', href: '#' },
  ],
  resources: [
    { name: 'Help Center', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Video Tutorials', href: '#' },
    { name: 'Case Studies', href: '#' },
    { name: 'System Status', href: '#' },
  ],
  company: [
    { name: 'About Us', href: '#about' },
    { name: 'Contact Us', href: '#contact' },
    { name: 'Careers', href: '#' },
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
  ],
};

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: '#', label: 'Instagram' },
];

function FooterLinkColumn({
  title,
  links,
  isInView,
  delay,
}: {
  title: string;
  links: { name: string; href: string }[];
  isInView: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ delay }}
    >
      <h3 className="text-white font-semibold mb-4">{title}</h3>
      <ul className="space-y-3">
        {links.map((link, index) => (
          <li key={index}>
            <motion.a
              href={link.href}
              className="text-gray-400 hover:text-white transition-colors"
              whileHover={{ x: 4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {link.name}
            </motion.a>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export function Footer() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <footer id="contact" className="bg-gray-900 pt-16 pb-8 relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div ref={ref} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-gray-800">
          {/* Brand Column */}
          <motion.div
            className="col-span-2 md:col-span-3 lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.1 }}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 mb-6">
              <motion.div
                whileHover={{ rotate: 5, scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center"
              >
                <BarChart3 className="h-5 w-5 text-white" />
              </motion.div>
              <span className="text-xl font-bold text-white">FinMatrix</span>
            </Link>

            <p className="text-gray-400 mb-6 max-w-sm">
              Pakistan's leading FBR-compliant cloud accounting software. Built for SMBs, loved by accountants.
            </p>

            {/* Contact Info */}
            <div className="space-y-3 text-gray-400">
              <motion.a
                href="mailto:waleedhassansfd@gmail.com"
                className="flex items-center gap-2 hover:text-white transition-colors"
                whileHover={{ x: 4 }}
              >
                <Mail className="h-4 w-4" />
                waleedhassansfd@gmail.com
              </motion.a>
              <motion.a
                href="tel:+923124890176"
                className="flex items-center gap-2 hover:text-white transition-colors"
                whileHover={{ x: 4 }}
              >
                <Phone className="h-4 w-4" />
                +92 3124890176
              </motion.a>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Lahore, Pakistan
              </div>
            </div>
          </motion.div>

          {/* Link Columns */}
          <FooterLinkColumn
            title="Product"
            links={footerLinks.product}
            isInView={isInView}
            delay={0.2}
          />
          <FooterLinkColumn
            title="Resources"
            links={footerLinks.resources}
            isInView={isInView}
            delay={0.3}
          />
          <FooterLinkColumn
            title="Company"
            links={footerLinks.company}
            isInView={isInView}
            delay={0.4}
          />
        </div>

        {/* Bottom Bar */}
        <motion.div
          className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.5 }}
        >
          {/* Copyright */}
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} FinMatrix. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social, index) => (
              <motion.a
                key={index}
                href={social.href}
                aria-label={social.label}
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <social.icon className="h-4 w-4" />
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
