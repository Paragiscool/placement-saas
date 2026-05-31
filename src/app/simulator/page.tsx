import React from 'react';
import RateLimitSimulator from '@/components/simulator/RateLimitSimulator';
import { Network } from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function SimulatorPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-12 font-sans selection:bg-cyan-500/30">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Navigation & Title */}
        <div className="space-y-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white flex items-center gap-4">
              <Network className="w-10 h-10 text-indigo-500" />
              Ingestion Architecture
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl leading-relaxed">
              Visualize how different rate-limiting algorithms manage request queues, failure rates, and execution efficiency under strict API quota boundaries.
            </p>
          </div>
        </div>

        {/* The Simulator */}
        <RateLimitSimulator />
        
        {/* Educational Content */}
        <div className="grid md:grid-cols-3 gap-6 pt-12 border-t border-slate-800/50">
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">Linear Delay</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              A rigid approach. When a 429 is hit, the script sleeps for a fixed duration. It is fragile under stress and highly inefficient if API quotas burst unpredictably.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">Exponential Backoff</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              The industry standard for resilience. Requests back off exponentially with added jitter to prevent server-side thundering herds. Safe, but sacrifices raw throughput.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">Token Bucket</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              The optimal architecture. A client-side tracking algorithm that consumes tokens exactly synchronized with the target API's rolling window, ensuring maximum legal execution speed.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
