import React from 'react';
import Link from 'next/link';
import { 
  PiMagnifyingGlassDuotone,
  PiShieldCheckDuotone,
  PiGraphDuotone,
  PiArrowRightBold,
  PiCheckCircleFill,
  PiCodeBlockDuotone
} from 'react-icons/pi';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-ink font-sans flex flex-col overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-ink/90 backdrop-blur-md border-b border-brand-canvas-soft/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center">
              <span className="text-brand-ink font-black text-sm">G</span>
            </div>
            <span className="font-display font-black text-2xl text-brand-canvas tracking-tight">GroundedAI</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-brand-canvas/80 hover:text-brand-primary font-semibold text-sm transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-brand-canvas/80 hover:text-brand-primary font-semibold text-sm transition-colors">How it works</Link>
            <Link href="#eval" className="text-brand-canvas/80 hover:text-brand-primary font-semibold text-sm transition-colors">Evaluations</Link>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hidden sm:block text-brand-canvas/90 hover:text-brand-canvas font-bold text-sm transition-colors">Log in</Link>
            <Link href="/dashboard" className="bg-brand-primary hover:bg-brand-primary-active text-brand-ink font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-[0_0_20px_rgba(159,232,112,0.3)]">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col pt-32 lg:pt-40 relative">
        {/* Background glow effects */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-primary/20 rounded-[100%] blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center relative z-10 w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-sm font-bold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PiCheckCircleFill className="w-4 h-4" />
            Introducing Self-Correcting RAG
          </div>
          
          <h1 className="font-display font-black text-5xl sm:text-7xl lg:text-[5.5rem] leading-[1.05] text-brand-canvas max-w-4xl tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            AI that <span className="text-brand-primary">double-checks</span> its own answers.
          </h1>
          
          <p className="text-xl sm:text-2xl text-brand-canvas/70 max-w-2xl font-medium leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Stop worrying about hallucinations. GroundedAI uses Corrective RAG (CRAG) to automatically evaluate context, trigger web fallbacks, and guarantee factual responses.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <Link href="/dashboard" className="bg-brand-primary hover:bg-brand-primary-active text-brand-ink font-bold text-lg px-8 py-4 rounded-2xl flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(159,232,112,0.4)] w-full sm:w-auto">
              Start Building Free
              <PiArrowRightBold className="w-5 h-5" />
            </Link>
            <Link href="/collections/123/chat" className="bg-transparent border-2 border-brand-canvas-soft/20 text-brand-canvas hover:bg-brand-canvas-soft/10 font-bold text-lg px-8 py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors w-full sm:w-auto">
              Try Interactive Demo
            </Link>
          </div>
        </div>

        {/* Hero Dashboard Preview */}
        <div className="max-w-6xl mx-auto px-6 w-full mt-24 mb-32 relative z-10 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
          <div className="rounded-[2rem] p-3 sm:p-5 bg-gradient-to-b from-brand-canvas-soft/10 to-transparent border border-brand-canvas-soft/10 shadow-2xl backdrop-blur-sm">
            <div className="rounded-2xl sm:rounded-[1.5rem] overflow-hidden border border-brand-canvas-soft/20 bg-brand-canvas relative aspect-[16/10] sm:aspect-[16/9] flex items-center justify-center shadow-inner">
               <div className="absolute inset-0 bg-brand-canvas-soft/50"></div>
               {/* Abstract representation of the chat UI */}
               <div className="w-full h-full p-4 sm:p-8 flex gap-6 absolute inset-0 z-10 opacity-90">
                  <div className="w-1/4 h-full bg-brand-canvas rounded-xl shadow-sm border border-brand-canvas-soft hidden md:block"></div>
                  <div className="flex-grow h-full bg-brand-canvas rounded-xl shadow-sm border border-brand-canvas-soft flex flex-col p-6 gap-4">
                     <div className="h-10 w-1/3 bg-brand-canvas-soft rounded-lg self-end"></div>
                     <div className="h-32 w-3/4 bg-brand-primary-pale rounded-lg"></div>
                     <div className="h-10 w-1/4 bg-brand-canvas-soft rounded-lg self-end mt-auto"></div>
                  </div>
                  <div className="w-1/3 h-full bg-brand-ink rounded-xl shadow-lg border border-brand-canvas-soft/10 p-6 flex flex-col gap-4">
                     <div className="h-6 w-1/2 bg-brand-canvas/10 rounded-md mb-4"></div>
                     <div className="h-8 w-full bg-brand-primary/20 rounded-md border border-brand-primary/30"></div>
                     <div className="h-12 w-full bg-brand-canvas/5 rounded-md"></div>
                     <div className="h-8 w-full bg-brand-warning/20 rounded-md border border-brand-warning/30 mt-4"></div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="bg-brand-canvas-soft py-32 relative z-20 rounded-t-[3rem] sm:rounded-t-[4rem]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center text-center mb-20">
            <h2 className="font-display font-black text-4xl sm:text-5xl text-brand-ink mb-6">
              Why settle for simple retrieval?
            </h2>
            <p className="text-xl text-brand-body max-w-3xl font-medium">
              Standard RAG systems fail when documents lack the exact answer. GroundedAI introduces a dynamic corrective loop to ensure your agents never guess.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-brand-canvas rounded-3xl p-8 shadow-sm border border-brand-canvas-soft/50 hover:shadow-md hover:border-brand-primary/30 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-brand-primary-pale flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <PiMagnifyingGlassDuotone className="w-7 h-7 text-brand-primary" />
              </div>
              <h3 className="font-display font-bold text-2xl text-brand-ink mb-4">Autonomous Web Fallback</h3>
              <p className="text-brand-body text-lg leading-relaxed">
                If the internal document retrieval scores too low on relevance, the agent automatically searches the web to supplement its context before answering.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-brand-canvas rounded-3xl p-8 shadow-sm border border-brand-canvas-soft/50 hover:shadow-md hover:border-brand-primary/30 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-brand-ink/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <PiCodeBlockDuotone className="w-7 h-7 text-brand-ink" />
              </div>
              <h3 className="font-display font-bold text-2xl text-brand-ink mb-4">Visible Agent Traces</h3>
              <p className="text-brand-body text-lg leading-relaxed">
                Don't treat your AI like a black box. See exactly what chunks were retrieved, how they were graded, and what logic loops were triggered in real-time.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-brand-canvas rounded-3xl p-8 shadow-sm border border-brand-canvas-soft/50 hover:shadow-md hover:border-brand-primary/30 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-[#e2f6d5] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <PiGraphDuotone className="w-7 h-7 text-brand-positive" />
              </div>
              <h3 className="font-display font-bold text-2xl text-brand-ink mb-4">Built-in Evaluation</h3>
              <p className="text-brand-body text-lg leading-relaxed">
                Stop guessing if your agent is getting better. Run automated benchmarks to track Faithfulness, Answer Relevancy, and Context Precision over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-brand-primary py-32 relative z-20">
        <div className="max-w-4xl mx-auto px-6 text-center flex flex-col items-center">
          <h2 className="font-display font-black text-5xl sm:text-6xl text-brand-ink mb-8 tracking-tight">
            Ready to ground your AI?
          </h2>
          <p className="text-2xl text-brand-ink/80 font-medium mb-12 max-w-2xl">
            Join developers building high-accuracy, self-correcting RAG applications in minutes.
          </p>
          <Link href="/dashboard" className="bg-brand-ink hover:bg-brand-ink-deep text-brand-canvas font-bold text-xl px-10 py-5 rounded-2xl flex items-center justify-center gap-3 transition-transform hover:scale-105 active:scale-95 shadow-2xl">
            Go to Dashboard
            <PiArrowRightBold className="w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-ink py-12 border-t border-brand-canvas-soft/10 relative z-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center">
              <span className="text-brand-ink font-black text-[10px]">G</span>
            </div>
            <span className="font-display font-bold text-xl text-brand-canvas">GroundedAI</span>
          </div>
          
          <div className="text-brand-canvas/40 text-sm font-medium">
            © 2026 GroundedAI Inc. All rights reserved.
          </div>
          
          <div className="flex items-center gap-6">
            <Link href="#" className="text-brand-canvas/60 hover:text-brand-primary text-sm font-semibold transition-colors">Twitter</Link>
            <Link href="#" className="text-brand-canvas/60 hover:text-brand-primary text-sm font-semibold transition-colors">GitHub</Link>
            <Link href="#" className="text-brand-canvas/60 hover:text-brand-primary text-sm font-semibold transition-colors">Docs</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
