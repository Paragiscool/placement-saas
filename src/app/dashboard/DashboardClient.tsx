'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageSquare, ArrowRight } from 'lucide-react'

import CompensationChart from '@/components/dashboard/CompensationChart'
import ProgressSection from '@/components/dashboard/ProgressSection'
import CategoryAccordion from '@/components/dashboard/CategoryAccordion'
import type { Job } from '@/types'

// Mock User Profile for semantic matching MVP
const userProfile = { 
  department: "Ocean Engineering & Naval Architecture", 
  skills: "Machine Learning, Python, C++, LightGBM, Siamese Networks, Data Science", 
  cgpa: 8.5 
};

export default function DashboardClient({ initialJobs, initialInterviews = [] }: { initialJobs: Job[], initialInterviews?: any[] }) {
  const [forYouJobs, setForYouJobs] = useState<Job[]>([]);

  useEffect(() => {
    async function fetchForYou() {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${API_BASE}/api/for-you`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userProfile)
        });
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          const formattedJobs: Job[] = data.results.map((r: any) => ({
            id: r.document_id,
            company: r.company,
            role: r.role,
            ctc: r.compensation_tier ? parseFloat(r.compensation_tier) : null,
            currency: "INR",
            location: null,
            category: "✨ Recommended For You",
            category_group: "tech",
            college_tag: "IIT KGP",
            apply_link: null,
            is_active: true,
            source: "AI",
            posted_at: new Date().toISOString()
          }));
          setForYouJobs(formattedJobs);
        }
      } catch (error) {
        console.error("Failed to fetch For You feed:", error);
      }
    }
    fetchForYou();
  }, []);

  const combinedJobs = [...forYouJobs, ...initialJobs];

  return (
    <div className="min-h-screen bg-surface flex flex-col">

      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 py-8 space-y-8">
        
        {/* Header Block */}
        <section className="mb-8">
          <nav className="text-sm text-slate-500 mb-2">IIT KGP &rsaquo; Career &rsaquo; <strong className="text-slate-300">Placement 2026</strong></nav>
          <h1 className="text-3xl font-bold text-white mb-3">Placement 2026 — Full Role Database</h1>
          <p className="text-slate-400 max-w-3xl leading-relaxed">
            A structured, searchable database of placement opportunities across 39 role categories. 
            Includes CTC data, application windows, and personalised tracking backed by Supabase.
          </p>
        </section>

        {/* Chat with Senior CTA */}
        <section className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-purple-500/20 bg-gradient-to-r from-purple-900/20 to-surface-elevated">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-0.5">Need Guidance?</h2>
              <p className="text-slate-400 text-sm max-w-lg">
                Get instant answers about company interview rounds, CTC, and strategies from our AI-powered senior knowledge base.
              </p>
            </div>
          </div>
          <Link
            href="/chat"
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-400 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
          >
            🤖 Chat with Senior <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        {/* Progress Section */}
        {initialInterviews.length > 0 && (
          <ProgressSection interviews={initialInterviews} />
        )}

        {/* Analytics Charts */}
        <section className="pt-6">
          <CompensationChart />
        </section>

        {/* Category Browser (Accordion) */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">Role Categories</h2>
            <p className="text-slate-400 text-sm mt-1">
              Select any category row below to view matching roles and track your applications.
            </p>
          </div>
          <CategoryAccordion jobs={combinedJobs} defaultExpanded="✨ Recommended For You" />
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-glass-border py-6 mt-12 text-center text-slate-500 text-sm">
        <p>PlacementIQ · IIT Kharagpur · Built with Next.js & Supabase</p>
      </footer>
    </div>
  )
}
