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

  // Fetch mock interviews for the authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  let interviews = []
  
  if (user) {
    const { data: interviewData, error: interviewError } = await supabase
      .from('mock_interviews')
      .select(`
        id, created_at, job_id, scorecard, transcript,
        jobs (company, role)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (interviewError) {
      console.error('Failed to fetch interviews:', interviewError)
    } else if (interviewData) {
      interviews = interviewData
    }
  }

  return <DashboardClient initialJobs={(jobs as Job[]) || []} initialInterviews={interviews} />
}
