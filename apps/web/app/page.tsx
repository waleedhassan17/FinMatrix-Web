import { Metadata } from 'next';
import {
  Navigation,
  Hero,
  TrustSection,
  ValueProps,
  Features,
  Pricing,
  HowItWorks,
  Testimonials,
  FinalCTA,
  Footer,
  LandingWrapper,
} from '@/components/landing';

export const metadata: Metadata = {
  title: "FinMatrix - Pakistan's FBR-Compliant Cloud Accounting Software",
  description:
    "Cloud accounting software built for Pakistani SMBs. FBR-compliant invoicing, GST calculations, and financial reporting. 40% cheaper than QuickBooks. Start free trial.",
  keywords: [
    'accounting software Pakistan',
    'FBR compliant',
    'GST calculator',
    'invoicing',
    'SMB accounting',
    'cloud accounting',
    'tax compliance',
  ],
  openGraph: {
    title: "FinMatrix - Pakistan's FBR-Compliant Cloud Accounting Software",
    description:
      'Cloud accounting software built for Pakistani SMBs. FBR-compliant invoicing, GST calculations, and financial reporting.',
    type: 'website',
    locale: 'en_PK',
  },
};

export default function LandingPage() {
  return (
    <LandingWrapper>
      <main className="min-h-screen">
        <Navigation />
        <Hero />
        <TrustSection />
        <ValueProps />
        <Features />
        <Pricing />
        <HowItWorks />
        <Testimonials />
        <FinalCTA />
        <Footer />
      </main>
    </LandingWrapper>
  );
}
