'use client'

import { usePathname } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'

/** Routes where the global Topbar should NOT be shown */
const HIDE_TOPBAR_ROUTES = ['/login', '/auth/login', '/auth/callback']

export default function ConditionalTopbar() {
  const pathname = usePathname()
  const shouldHide = HIDE_TOPBAR_ROUTES.some(route => pathname.startsWith(route))

  if (shouldHide) return null
  return <Topbar />
}
