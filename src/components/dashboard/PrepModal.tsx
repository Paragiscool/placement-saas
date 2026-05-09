'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PrepResource } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, BookOpen, Zap, BarChart3, Users } from 'lucide-react'

interface PrepModalProps {
  companyName: string
  onClose: () => void
}

const DIFFICULTY_COLOR = {
  Easy:   'text-green-400 border-green-400/30 bg-green-400/10',
  Medium: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  Hard:   'text-red-400 border-red-400/30 bg-red-400/10',
}

export default function PrepModal({ companyName, onClose }: PrepModalProps) {
  const [data, setData] = useState<PrepResource | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('prep_resources')
      .select('*')
      .ilike('company_name', companyName)
      .maybeSingle()
      .then(({ data }) => {
        setData(data)
        setLoading(false)
      })
  }, [companyName, supabase])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const googleSearch = `https://www.google.com/search?q=${encodeURIComponent(companyName + ' interview questions experience')}`
  const linkedInUrl  = `https://www.linkedin.com/company/${encodeURIComponent(companyName.toLowerCase().replace(/\s+/g, '-'))}`

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 400 }}
          className="glass-card w-full max-w-2xl max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 glass border-b border-glass-border p-5 flex items-start justify-between z-10">
            <div>
              <h2 className="text-xl font-bold text-white">
                🚀 Roadmap to Crack <span className="text-neon">{companyName}</span>
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">Company-specific interview intelligence</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-glass-border flex items-center justify-center text-slate-400 hover:text-white transition-all ml-4 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map((i) => <div key={i} className="skeleton h-6 rounded-lg" />)}
              </div>
            ) : !data ? (
              /* No data fallback */
              <div className="text-center py-8">
                <div className="text-5xl mb-3">📭</div>
                <h3 className="text-white font-semibold text-lg">No prep data yet</h3>
                <p className="text-slate-400 text-sm mt-1 mb-6">
                  We haven&apos;t curated prep resources for {companyName} yet.
                  Start with these quick links:
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <a href={googleSearch} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-neon/10 border border-neon/30 text-neon px-4 py-2 rounded-lg text-sm hover:bg-neon/20 transition-all">
                    <ExternalLink className="w-4 h-4" />
                    Search Interview Exp
                  </a>
                  <a href={linkedInUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-white/5 border border-glass-border text-slate-300 px-4 py-2 rounded-lg text-sm hover:bg-white/10 transition-all">
                    💼 LinkedIn Page
                  </a>
                </div>
              </div>
            ) : (
              <>
                {/* Company Summary */}
                {data.company_summary && (
                  <div className="bg-neon/5 border border-neon/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-neon font-semibold text-sm mb-2">
                      <BookOpen className="w-4 h-4" /> Company Overview
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{data.company_summary}</p>
                  </div>
                )}

                {/* Meta badges */}
                <div className="flex flex-wrap gap-3">
                  {data.difficulty && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium ${DIFFICULTY_COLOR[data.difficulty]}`}>
                      <Zap className="w-3.5 h-3.5" />
                      Difficulty: {data.difficulty}
                    </span>
                  )}
                  {data.avg_rounds && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-400/30 bg-purple-400/10 text-purple-400 text-sm font-medium">
                      <BarChart3 className="w-3.5 h-3.5" />
                      ~{data.avg_rounds} Interview Rounds
                    </span>
                  )}
                </div>

                {/* Interview Process */}
                {data.interview_patterns && data.interview_patterns.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-2.5 flex items-center gap-2">
                      <Users className="w-4 h-4 text-neon" /> Interview Process
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {data.interview_patterns.map((p, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-neon/20 border border-neon/30 text-neon text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                          <span className="text-slate-300 text-sm bg-white/5 border border-glass-border px-3 py-1 rounded-lg">{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Topics */}
                {data.top_topics && data.top_topics.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-2.5">🎯 Key Topics to Master</h3>
                    <div className="flex flex-wrap gap-2">
                      {data.top_topics.map((t) => (
                        <span key={t} className="bg-white/5 border border-glass-border text-slate-300 text-sm px-3 py-1 rounded-lg hover:border-neon/30 hover:text-neon transition-all cursor-default">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prep Links */}
                {data.prep_links && Object.keys(data.prep_links).length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-2.5">📚 Curated Resources</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(data.prep_links).map(([label, url]) => (
                        <a
                          key={label}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-white/5 border border-glass-border hover:border-neon/30 hover:bg-neon/5 text-slate-300 hover:text-neon text-sm px-3 py-2.5 rounded-lg transition-all group"
                        >
                          <ExternalLink className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                          {label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Senior Experiences */}
                {data.interview_exp_links && data.interview_exp_links.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-2.5">👨‍🎓 Senior Experiences</h3>
                    <div className="space-y-1.5">
                      {data.interview_exp_links.map((link, i) => (
                        <a
                          key={i}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-slate-400 hover:text-neon text-sm transition-colors truncate"
                        >
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          {link}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Footer actions */}
            <div className="pt-2 border-t border-glass-border flex gap-2">
              <a href={googleSearch} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-neon/10 border border-neon/30 text-neon text-sm py-2 rounded-lg hover:bg-neon/20 transition-all">
                <ExternalLink className="w-3.5 h-3.5" /> More Resources
              </a>
              <a href={linkedInUrl} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-glass-border text-slate-300 text-sm py-2 rounded-lg hover:bg-white/10 transition-all">
                💼 Company LinkedIn
              </a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
