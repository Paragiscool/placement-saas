import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'
import type { Job } from '@/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createClient()

  // Fetch all active jobs from the database
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('is_active', true)
    .order('posted_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch jobs:', error)
  }

  return <DashboardClient initialJobs={(jobs as Job[]) || []} />
}
