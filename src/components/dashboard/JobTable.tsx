'use client'

import { useState, useEffect, useCallback } from 'react'

import { useApplications } from '@/hooks/useApplications'
import { useUser } from '@/hooks/useUser'
import { formatCTC, getCatConfig } from '@/lib/cat-config'
import Badge from '@/components/ui/Badge'
import PrepModal from './PrepModal'
import type { Job, ApplicationStatus, FilterState } from '@/types'
import { ChevronUp, ChevronDown, ChevronsUpDown, ExternalLink } from 'lucide-react'

const PAGE_SIZE = 50

const DEFAULT_FILTERS: FilterState = {
  search: '',
  category: 'all',
  ctcRange: 'all',
  currency: 'all',
  status: 'all',
  sort: 'asc',
}

interface JobTableProps {
  initialJobs: Job[]
  activeCategory: string
  onCategoryChange: (cat: string) => void
}

export default function JobTable({ initialJobs, activeCategory, onCategoryChange }: JobTableProps) {
  const { user } = useUser()
  const { applications, setStatus } = useApplications(user?.id ?? null)
  const [jobs] = useState<Job[]>(initialJobs)
  const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTERS, category: activeCategory })
  const [currentPage, setCurrentPage] = useState(1)
  const [prepCompany, setPrepCompany] = useState<string | null>(null)
  const [sortCol, setSortCol] = useState<'ctc' | 'company'>('ctc')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  // Listen for topbar search events
  useEffect(() => {
    const handler = (e: Event) => {
      setFilters((f) => ({ ...f, search: (e as CustomEvent).detail }))
      setCurrentPage(1)
    }
    window.addEventListener('topbar-search', handler)
    return () => window.removeEventListener('topbar-search', handler)
  }, [])

  // Sync activeCategory prop
  useEffect(() => {
    setFilters((f) => ({ ...f, category: activeCategory }))
    setCurrentPage(1)
  }, [activeCategory])

  // ── FILTER & SORT ──────────────────────────────────────────────────────────
  const filteredJobs = useCallback(() => {
    let result = [...jobs]
    const q = filters.search.toLowerCase().trim()

    if (filters.category !== 'all') result = result.filter((j) => j.category === filters.category)
    if (q) result = result.filter((j) =>
      j.company.toLowerCase().includes(q) || j.role.toLowerCase().includes(q)
    )
    if (filters.currency !== 'all') result = result.filter((j) => j.currency === filters.currency)
    if (filters.ctcRange !== 'all') {
      result = result.filter((j) => {
        const c = j.ctc ?? 0
        if (filters.ctcRange === '0-10')  return c > 0 && c <= 10
        if (filters.ctcRange === '10-20') return c > 10 && c <= 20
        if (filters.ctcRange === '20-30') return c > 20 && c <= 30
        if (filters.ctcRange === '30-50') return c > 30 && c <= 50
        if (filters.ctcRange === '50+')   return c > 50
        return true
      })
    }
    if (filters.status !== 'all') {
      result = result.filter((j) => (applications[j.id] ?? '') === filters.status)
    }

    // Sort
    if (sortCol === 'ctc')     result.sort((a, b) => sortDir === 'asc' ? (a.ctc ?? 0) - (b.ctc ?? 0) : (b.ctc ?? 0) - (a.ctc ?? 0))
    if (sortCol === 'company') result.sort((a, b) => sortDir === 'asc' ? a.company.localeCompare(b.company) : b.company.localeCompare(a.company))

    return result
  }, [jobs, filters, applications, sortCol, sortDir])

  const filtered = filteredJobs()
  const pages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function toggleSort(col: 'ctc' | 'company') {
    if (sortCol === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
    setCurrentPage(1)
  }

  function SortIcon({ col }: { col: 'ctc' | 'company' }) {
    if (sortCol !== col) return <ChevronsUpDown className="inline w-3 h-3 opacity-40 ml-1" />
    return sortDir === 'asc'
      ? <ChevronUp className="inline w-3 h-3 text-neon ml-1" />
      : <ChevronDown className="inline w-3 h-3 text-neon ml-1" />
  }

  // ── STATS ───────────────────────────────────────────────────────────────────
  const inrJobs = filtered.filter((j) => j.currency === 'INR' && (j.ctc ?? 0) > 0)
  const avgCTC = inrJobs.length ? (inrJobs.reduce((s, j) => s + (j.ctc ?? 0), 0) / inrJobs.length) : 0
  const topCTC = inrJobs.length ? Math.max(...inrJobs.map((j) => j.ctc ?? 0)) : 0
  const appliedCount = Object.values(applications).filter((s) => s === 'Applied').length

  return (
    <div className="flex flex-col gap-4">
      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Matching Roles', value: filtered.length, icon: '🎯' },
          { label: 'Avg CTC (INR)',  value: avgCTC > 0 ? `${avgCTC.toFixed(1)} LPA` : '–', icon: '📊' },
          { label: 'Top CTC',        value: topCTC > 0 ? `${topCTC.toFixed(1)} LPA` : '–', icon: '💰' },
          { label: 'Applied',        value: appliedCount, icon: '✅' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-3 flex items-center gap-3">
            <span className="text-xl">{s.icon}</span>
            <div>
              <div className="text-lg font-bold text-white leading-none">{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters row ───────────────────────────────────────────────────── */}
      <div className="glass-card p-3 flex flex-wrap gap-2 items-center">
        <select
          className="bg-white/5 border border-glass-border text-slate-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-neon"
          value={filters.ctcRange}
          onChange={(e) => { setFilters((f) => ({ ...f, ctcRange: e.target.value })); setCurrentPage(1) }}
        >
          <option value="all">All CTC Ranges</option>
          <option value="0-10">Under 10 LPA</option>
          <option value="10-20">10 – 20 LPA</option>
          <option value="20-30">20 – 30 LPA</option>
          <option value="30-50">30 – 50 LPA</option>
          <option value="50+">50+ LPA</option>
        </select>

        <select
          className="bg-white/5 border border-glass-border text-slate-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-neon"
          value={filters.currency}
          onChange={(e) => { setFilters((f) => ({ ...f, currency: e.target.value })); setCurrentPage(1) }}
        >
          <option value="all">All Currencies</option>
          <option value="INR">INR</option>
          <option value="USD">USD</option>
          <option value="GBP">GBP</option>
          <option value="JPY">JPY</option>
        </select>

        <select
          className="bg-white/5 border border-glass-border text-slate-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-neon"
          value={filters.status}
          onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setCurrentPage(1) }}
        >
          <option value="all">All Statuses</option>
          <option value="Preparing">Preparing</option>
          <option value="Applied">Applied</option>
          <option value="Shortlisted">Shortlisted</option>
          <option value="Rejected">Rejected</option>
        </select>

        {/* Active filter pills */}
        {filters.category !== 'all' && (
          <span className="flex items-center gap-1 bg-neon/10 border border-neon/30 text-neon text-xs px-2.5 py-1 rounded-full">
            {getCatConfig(filters.category).icon} {filters.category}
            <button onClick={() => { onCategoryChange('all'); setCurrentPage(1) }} className="ml-1 hover:text-white">✕</button>
          </span>
        )}

        <div className="ml-auto text-slate-500 text-sm">
          <strong className="text-slate-300">{filtered.length}</strong> roles
        </div>

        <button
          onClick={() => {
            setFilters(DEFAULT_FILTERS)
            onCategoryChange('all')
            setCurrentPage(1)
            window.dispatchEvent(new CustomEvent('topbar-search', { detail: '' }))
          }}
          className="text-xs text-slate-500 hover:text-neon transition-colors"
        >
          ↺ Reset
        </button>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th onClick={() => toggleSort('company')} className="text-left">
                  Company <SortIcon col="company" />
                </th>
                <th className="text-left">Role / Position</th>
                <th onClick={() => toggleSort('ctc')} className="text-left">
                  CTC <SortIcon col="ctc" />
                </th>
                <th>Category</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-500">
                    <div className="text-4xl mb-3">🔍</div>
                    <p className="font-medium">No roles found</p>
                    <p className="text-sm mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : paginated.map((job, i) => {
                const st = applications[job.id] ?? ''
                return (
                  <tr key={job.id} className="fade-in">
                    <td className="text-slate-600 text-xs">{(currentPage - 1) * PAGE_SIZE + i + 1}</td>
                    <td>
                      <button
                        onClick={() => setPrepCompany(job.company)}
                        className="text-white font-medium hover:text-neon transition-colors text-left leading-snug"
                        title="View prep resources"
                      >
                        {job.company}
                      </button>
                    </td>
                    <td className="text-slate-300 max-w-[200px] truncate" title={job.role}>
                      {job.role}
                    </td>
                    <td>
                      <span className="text-white font-semibold tabular-nums">
                        {formatCTC(job.ctc, job.currency)}
                      </span>
                    </td>
                    <td>
                      {job.category && <Badge category={job.category} />}
                    </td>
                    <td>
                      {user ? (
                        <select
                          className={`status-select ${st ? `status-${st}` : ''}`}
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
                        <span className="text-slate-600 text-xs">Sign in to track</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPrepCompany(job.company)}
                          className="text-xs bg-neon/10 border border-neon/20 text-neon hover:bg-neon/20 px-2.5 py-1 rounded-md transition-all"
                        >
                          🧠 Prep
                        </button>
                        {job.apply_link && (
                          <a
                            href={job.apply_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-white/5 border border-glass-border text-slate-400 hover:text-white hover:border-slate-500 px-2 py-1 rounded-md transition-all"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4 border-t border-glass-border">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-3 py-1.5 text-sm rounded-lg bg-white/5 border border-glass-border text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(5, pages) }, (_, i) => {
              const start = Math.max(1, currentPage - 2)
              const p = start + i
              if (p > pages) return null
              return (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 text-sm rounded-lg transition-all ${
                    p === currentPage
                      ? 'bg-neon text-slate-900 font-bold shadow-neon-sm'
                      : 'bg-white/5 border border-glass-border text-slate-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              )
            })}
            <button
              disabled={currentPage === pages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1.5 text-sm rounded-lg bg-white/5 border border-glass-border text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Prep Modal */}
      {prepCompany && (
        <PrepModal companyName={prepCompany} onClose={() => setPrepCompany(null)} />
      )}
    </div>
  )
}
