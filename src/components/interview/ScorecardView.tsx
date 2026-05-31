import React from 'react'
import { motion } from 'framer-motion'
import { Brain, MessageSquare, Target, TrendingUp, TrendingDown, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Scorecard {
  technical_depth_score: number
  communication_score: number
  problem_solving_score: number
  strengths: string[]
  areas_for_improvement: string[]
  final_verdict: string
}

interface ScorecardViewProps {
  scorecard: Scorecard
  jobContext: string
}

export default function ScorecardView({ scorecard, jobContext }: ScorecardViewProps) {
  const renderVerdictBadge = (verdict: string) => {
    if (verdict.includes("Strong Hire")) return <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-4 py-1.5 rounded-full font-bold uppercase tracking-wider">{verdict}</span>
    if (verdict.includes("Lean Hire")) return <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-4 py-1.5 rounded-full font-bold uppercase tracking-wider">{verdict}</span>
    return <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-1.5 rounded-full font-bold uppercase tracking-wider">{verdict}</span>
  }

  return (
    <motion.div 
      key="scorecard"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", damping: 25 }}
      className="max-w-4xl mx-auto pb-10"
    >
      <div className="glass-card rounded-2xl overflow-hidden shadow-2xl border border-glass-border">
        {/* Scorecard Header */}
        <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-b border-glass-border p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <h2 className="text-3xl font-bold text-white mb-2 relative z-10">Interview Evaluation</h2>
          <p className="text-slate-300 mb-6 relative z-10">{jobContext}</p>
          <div className="flex justify-center relative z-10">
            {renderVerdictBadge(scorecard.final_verdict)}
          </div>
        </div>

        <div className="p-8">
          {/* Scores Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white/5 border border-glass-border rounded-xl p-5 text-center flex flex-col items-center justify-center">
              <Brain className="w-6 h-6 text-purple-400 mb-3" />
              <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold mb-1">Technical Depth</p>
              <p className="text-4xl font-black text-white">{scorecard.technical_depth_score}<span className="text-xl text-slate-500 font-medium">/10</span></p>
            </div>
            <div className="bg-white/5 border border-glass-border rounded-xl p-5 text-center flex flex-col items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-400 mb-3" />
              <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold mb-1">Communication</p>
              <p className="text-4xl font-black text-white">{scorecard.communication_score}<span className="text-xl text-slate-500 font-medium">/10</span></p>
            </div>
            <div className="bg-white/5 border border-glass-border rounded-xl p-5 text-center flex flex-col items-center justify-center">
              <Target className="w-6 h-6 text-neon mb-3" />
              <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold mb-1">Problem Solving</p>
              <p className="text-4xl font-black text-white">{scorecard.problem_solving_score}<span className="text-xl text-slate-500 font-medium">/10</span></p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Strengths */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-glass-border pb-2">
                <TrendingUp className="w-5 h-5 text-green-400" /> Key Strengths
              </h3>
              <ul className="space-y-3">
                {scorecard.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 bg-green-500/5 border border-green-500/10 p-3 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300 text-sm leading-relaxed">{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas for Improvement */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-glass-border pb-2">
                <TrendingDown className="w-5 h-5 text-red-400" /> Areas for Improvement
              </h3>
              <ul className="space-y-3">
                {scorecard.areas_for_improvement.map((a, i) => (
                  <li key={i} className="flex items-start gap-3 bg-red-500/5 border border-red-500/10 p-3 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300 text-sm leading-relaxed">{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Return to Dashboard Button */}
        <div className="bg-black/20 p-6 flex justify-center border-t border-glass-border">
          <Link 
            href="/dashboard"
            className="bg-neon text-black hover:bg-neon/90 px-8 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(0,240,255,0.2)] hover:shadow-[0_0_25px_rgba(0,240,255,0.4)] transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" /> Return to Dashboard
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
