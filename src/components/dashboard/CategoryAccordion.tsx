'use client'

import { useState } from 'react'
import type { Job, ApplicationStatus } from '@/types'
import { CAT_CFG, formatCTC } from '@/lib/cat-config'
import { useUser } from '@/hooks/useUser'
import { useApplications } from '@/hooks/useApplications'
import { ExternalLink, Play } from 'lucide-react'
import Link from 'next/link'
import SaveRoleButton from './SaveRoleButton'

interface CategoryAccordionProps {
  jobs: Job[]
  defaultExpanded?: string
}

export default function CategoryAccordion({ jobs, defaultExpanded }: CategoryAccordionProps) {
  // Tracks which category is currently expanded
  const [expandedCategory, setExpandedCategory] = useState<string | null>(defaultExpanded || null)
  
  const { user } = useUser()
  const { applications, setStatus } = useApplications(user?.id ?? null)

  const toggleCategory = (category: string) => {
    // If clicking the already open one, close it. Otherwise, open the new one.
    setExpandedCategory((prev) => (prev === category ? null : category))
  }

  // Group jobs by category
  const jobsByCategory = jobs.reduce((acc, job) => {
    const cat = job.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(job)
    return acc
  }, {} as Record<string, Job[]>)

  // Sort categories by number of jobs descending
  const sortedCategories = Object.keys(jobsByCategory).sort((a, b) => jobsByCategory[b].length - jobsByCategory[a].length)

  return (
    <div className="space-y-4">
      {sortedCategories.map((category) => {
        const categoryJobs = jobsByCategory[category]
        
        let cfg = CAT_CFG[category] || CAT_CFG['Other']
        if (category === "✨ Recommended For You") {
          cfg = { icon: "✨", badge: "bg-purple-500", group: "tech", sub: "Personalized AI Matches" }
        }
        
        const isExpanded = expandedCategory === category

        return (
          <div key={category} className="border border-glass-border rounded-xl bg-surface-elevated overflow-hidden shadow-sm">
            
            {/* The Clickable Category Header */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-white/10 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl bg-white/5 w-12 h-12 flex items-center justify-center rounded-xl border border-glass-border">
                  {cfg.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{category}</h2>
                  <p className="text-sm text-slate-400 mt-0.5">{categoryJobs.length} roles available</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* Preview avatars/stats could go here */}
                <div className={`w-8 h-8 flex items-center justify-center rounded-full bg-neon/10 text-neon transform transition-transform duration-300 ${
                  isExpanded ? "rotate-180" : ""
                }`}>
                  ▼
                </div>
              </div>
            </button>

            {/* The Expandable Company List */}
            <div
              className={`transition-all duration-300 ease-in-out ${
                isExpanded
                  ? "max-h-[800px] opacity-100 p-5 border-t border-glass-border overflow-y-auto"
                  : "max-h-0 opacity-0 px-5 py-0 pointer-events-none"
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryJobs.map((job) => {
                  const st = applications[job.id] ?? ''
                  
                  return (
                    <div key={job.id} className="bg-white/5 p-4 rounded-xl border border-glass-border hover:border-neon/30 transition-all flex flex-col h-full">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          <h3 className="text-base font-bold text-white truncate pr-2" title={job.company}>
                            {job.company}
                          </h3>
                          <SaveRoleButton company={job.company} role={job.role} />
                        </div>
                        <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20 whitespace-nowrap">
                          {formatCTC(job.ctc, job.currency)}
                        </span>
                      </div>
                      <p className="text-sm text-neon mb-3 line-clamp-2" title={job.role}>{job.role}</p>
                      
                      <div className="mt-auto pt-3 border-t border-glass-border flex items-center justify-between gap-2">
                        {user ? (
                          <select
                            className={`status-select w-full ${st ? `status-${st}` : ''}`}
                            value={st}
                            onChange={(e) => setStatus(job.id, e.target.value as ApplicationStatus | '')}
                          >
                            <option value="">🕐 Not Applied</option>
                            <option value="Preparing">🔵 Preparing</option>
                            <option value="Applied">✅ Applied</option>
                            <option value="Shortlisted">⭐ Shortlisted</option>
                            <option value="Rejected">❌ Rejected</option>
                          </select>
                        ) : (
                          <span className="text-slate-600 text-xs w-full text-center bg-black/20 rounded py-1.5 border border-glass-border">Sign in to track</span>
                        )}
                        
                        {job.apply_link && (
                          <a
                            href={job.apply_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-neon/10 border border-neon/20 text-neon hover:bg-neon/20 transition-all flex-shrink-0"
                            title="Apply Link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <Link
                          href={`/interview?company=${encodeURIComponent(job.company)}&role=${encodeURIComponent(job.role)}`}
                          className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-all flex-shrink-0"
                          title="Simulate Interview"
                        >
                          <Play className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        )
      })}
    </div>
  )
}
