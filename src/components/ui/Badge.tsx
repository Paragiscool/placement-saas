'use client'

import { getCatConfig } from '@/lib/cat-config'

interface BadgeProps {
  category: string
  size?: 'sm' | 'md'
}

export default function Badge({ category, size = 'md' }: BadgeProps) {
  const cfg = getCatConfig(category)
  return (
    <span className={`badge ${cfg.badge} ${size === 'sm' ? 'text-[10px] py-0.5 px-1.5' : ''}`}>
      {cfg.icon} {category}
    </span>
  )
}
