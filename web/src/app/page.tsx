import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Hero } from '@/components/landing/Hero';
import { TextMarquee } from '@/components/landing/TextMarquee';
import { TerminalPreview } from '@/components/landing/TerminalPreview';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { Documentation } from '@/components/landing/Documentation';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      <Navbar />

      <main>
        <Hero />
        <TextMarquee />
        <TerminalPreview />
        <FeatureGrid />
        <HowItWorks />
        <Documentation />
      </main>

      <Footer />
    </div>
  );
}
