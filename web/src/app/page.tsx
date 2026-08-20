import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      <Navbar />

      <main>
        <section id="hero" className="pt-14">
          <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15] text-[var(--text-primary)]">
                  your localhost,
                  <br />
                  <span className="text-[var(--teal)]">on the public internet.</span>
                </h1>
                <p className="mt-5 text-[15px] md:text-[16px] leading-relaxed text-[var(--text-secondary)] max-w-lg">
                  zero-dependency tunneling with a custom 9-byte binary multiplexer,
                  interactive terminal tui, and instant request replay.
                  fast, private, self-hosted.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-start gap-4">
                  <div className="group flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--border-normal)] bg-[var(--card-panel)] text-[13px] text-[var(--text-secondary)] select-all cursor-text hover:border-[var(--border-accent)] transition-colors duration-150">
                    <span className="text-[var(--text-dim)]">$</span>
                    <span>curl -fsSL https://tunneru.dev/install.sh | sh</span>
                  </div>
                </div>
              </div>

              <div className="hidden lg:flex items-center justify-center">
                <div className="w-full aspect-square max-w-[480px] rounded-xl border border-[var(--border-subtle)] bg-[var(--card-alt)] flex items-center justify-center text-[var(--text-dim)] text-[13px]">
                  3d particle tunnel - phase 2
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="terminal-preview" className="border-t border-[var(--border-subtle)]">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="rounded-xl border border-[var(--border-normal)] bg-[var(--card-panel)] p-8 flex items-center justify-center min-h-[320px] text-[var(--text-dim)] text-[13px]">
              terminal preview — phase 3
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-t border-[var(--border-subtle)]">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="text-center text-[var(--text-dim)] text-[13px]">
              how it works — phase 4
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-[var(--border-subtle)]">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="text-center text-[var(--text-dim)] text-[13px]">
              feature bento grid — phase 4
            </div>
          </div>
        </section>

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
