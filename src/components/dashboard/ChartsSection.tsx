'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import type { Job } from '@/types'

interface ChartsSectionProps {
  jobs: Job[]
}

const COLORS = ['#3b82f6', '#8b5cf6', '#14b8a6', '#f59e0b', '#ef4444', '#22c55e', '#a855f7', '#06b6d4', '#f43f5e']

export default function ChartsSection({ jobs }: ChartsSectionProps) {
  // 1. CTC Distribution Data
  const ctcData = useMemo(() => {
    const inrJobs = jobs.filter(j => j.currency === 'INR' && j.ctc && j.ctc > 0)
    const bands = { '<5': 0, '5-10': 0, '10-20': 0, '20-30': 0, '30-50': 0, '50+': 0 }
    
    inrJobs.forEach(j => {
      const c = j.ctc!
      if (c < 5) bands['<5']++
      else if (c < 10) bands['5-10']++
      else if (c < 20) bands['10-20']++
      else if (c < 30) bands['20-30']++
      else if (c < 50) bands['30-50']++
      else bands['50+']++
    })

    return Object.entries(bands).map(([name, value]) => ({ name: `${name} LPA`, count: value }))
  }, [jobs])

  // 2. Top Categories Data
  const catData = useMemo(() => {
    const counts: Record<string, number> = {}
    jobs.forEach(j => {
      if (j.category) counts[j.category] = (counts[j.category] || 0) + 1
    })
    
    // Get top 8 categories
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }))
  }, [jobs])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1d2e] border border-glass-border p-3 rounded-lg shadow-xl">
          <p className="text-slate-300 text-sm mb-1 font-medium">{label || payload[0].name}</p>
          <p className="text-neon font-bold">{payload[0].value} roles</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* CTC Bar Chart */}
      <div className="glass-card p-5 h-80">
        <h3 className="text-white font-semibold text-sm mb-6">CTC Distribution (INR)</h3>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={ctcData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {ctcData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Categories Doughnut Chart */}
      <div className="glass-card p-5 h-80">
        <h3 className="text-white font-semibold text-sm mb-2">Top Hiring Categories</h3>
        <ResponsiveContainer width="100%" height="90%">
          <PieChart>
            <Pie
              data={catData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {catData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="middle" 
              align="right"
              layout="vertical"
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
