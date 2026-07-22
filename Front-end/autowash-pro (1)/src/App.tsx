/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { BenefitsSection } from './components/BenefitsSection';
import { PackagesSection } from './components/PackagesSection';
import { ProcessSection } from './components/ProcessSection';
import { LocationsSection } from './components/LocationsSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { FAQSection } from './components/FAQSection';
import { FinalCTASection } from './components/FinalCTASection';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen bg-background text-text-primary selection:bg-primary/20 selection:text-primary-dark">
      <Navbar />
      <main>
        <HeroSection />
        <BenefitsSection />
        <PackagesSection />
        <ProcessSection />
        <LocationsSection />
        <TestimonialsSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
}
