'use client'

import { useState } from 'react'
import Topbar from '@/components/layout/Topbar'
import JobTable from '@/components/dashboard/JobTable'
import CategoryCards from '@/components/dashboard/CategoryCards'
import ChartsSection from '@/components/dashboard/ChartsSection'
import type { Job } from '@/types'

export default function DashboardClient({ initialJobs }: { initialJobs: Job[] }) {
  const [activeCategory, setActiveCategory] = useState<string>('all')

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Topbar />

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

        {/* Analytics Charts */}
        <ChartsSection jobs={initialJobs} />

        {/* Category Browser */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">Role Categories</h2>
            <p className="text-slate-400 text-sm mt-1">
              Select any category card below to filter the full listings table.
            </p>
          </div>
          <CategoryCards 
            jobs={initialJobs} 
            activeCategory={activeCategory} 
            onCategoryChange={setActiveCategory} 
          />
        </section>

        {/* Full Listings Data Table */}
        <section className="pt-6 border-t border-glass-border">
          <h2 className="text-2xl font-bold text-white mb-6">Company Listings</h2>
          <JobTable 
            initialJobs={initialJobs} 
            activeCategory={activeCategory} 
            onCategoryChange={setActiveCategory} 
          />
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-glass-border py-6 mt-12 text-center text-slate-500 text-sm">
        <p>PlacementIQ · IIT Kharagpur · Built with Next.js & Supabase</p>
      </footer>
    </div>
  )
}
