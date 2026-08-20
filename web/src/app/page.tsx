import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Hero } from '@/components/landing/Hero';
import { TerminalPreview } from '@/components/landing/TerminalPreview';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { FeatureGrid } from '@/components/landing/FeatureGrid';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      <Navbar />

      <main>
        <Hero />
        <TerminalPreview />
        <HowItWorks />
        <FeatureGrid />

        <section id="docs" className="border-t border-[var(--border-subtle)]">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="text-center text-[var(--text-dim)] text-[13px]">
              documentation tabs — phase 5
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
