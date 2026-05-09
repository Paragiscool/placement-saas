'use client'

import { CATEGORY_GROUPS, CAT_CFG } from '@/lib/cat-config'
import type { Job } from '@/types'
import { motion, Variants } from 'framer-motion'

interface CategoryCardsProps {
  jobs: Job[]
  activeCategory: string
  onCategoryChange: (cat: string) => void
}

export default function CategoryCards({ jobs, activeCategory, onCategoryChange }: CategoryCardsProps) {
  // Compute counts and average CTCs per category
  const stats = jobs.reduce((acc, job) => {
    if (!job.category) return acc
    if (!acc[job.category]) acc[job.category] = { count: 0, sumCTC: 0, ctcCount: 0 }
    acc[job.category].count++
    if (job.currency === 'INR' && job.ctc && job.ctc > 0) {
      acc[job.category].sumCTC += job.ctc
      acc[job.category].ctcCount++
    }
    return acc
  }, {} as Record<string, { count: number; sumCTC: number; ctcCount: number }>)

  // Animation variants
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  }

  const item: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300 } },
  }

  return (
    <div className="space-y-8">
      {Object.values(CATEGORY_GROUPS).map((group) => {
        // Find categories belonging to this group
        const groupCats = Object.entries(CAT_CFG).filter(([, cfg]) => cfg.group === group.key)
        if (groupCats.length === 0) return null

        return (
          <div key={group.key}>
            <h3 className="text-white font-semibold text-lg mb-4">{group.label}</h3>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
            >
              {groupCats.map(([catName, cfg]) => {
                const stat = stats[catName]
                const count = stat?.count || 0
                const avg = stat?.ctcCount ? (stat.sumCTC / stat.ctcCount).toFixed(1) : null
                const isActive = activeCategory === catName

                return (
                  <motion.div
                    key={catName}
                    variants={item}
                    onClick={() => onCategoryChange(isActive ? 'all' : catName)}
                    className={`
                      relative p-3 rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden group
                      ${isActive 
                        ? 'bg-neon/10 border-neon shadow-neon-sm' 
                        : 'bg-white/5 border-glass-border hover:border-slate-500 hover:bg-white/10'
                      }
                    `}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-br from-neon/10 to-transparent pointer-events-none" />
                    )}
                    <div className="text-2xl mb-2">{cfg.icon}</div>
                    <div className={`font-semibold text-sm mb-1 leading-tight ${isActive ? 'text-neon' : 'text-slate-200'}`}>
                      {catName}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-500 font-medium">{count} roles</span>
                      {avg && <span className="text-[10px] text-slate-400 font-medium bg-white/5 px-1.5 py-0.5 rounded">~{avg}L</span>}
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}
