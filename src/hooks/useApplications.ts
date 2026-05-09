'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useCallback } from 'react'
import type { Application, ApplicationStatus } from '@/types'

export function useApplications(userId: string | null) {
  const [applications, setApplications] = useState<Record<string, ApplicationStatus>>({})
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // Load all user's applications on mount
  useEffect(() => {
    if (!userId) return
    setLoading(true)
    supabase
      .from('applications')
      .select('job_id, status')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, ApplicationStatus> = {}
          data.forEach((a) => { map[a.job_id] = a.status as ApplicationStatus })
          setApplications(map)
        }
        setLoading(false)
      })
  }, [userId, supabase])

  // Real-time subscription to user's applications
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('applications-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'applications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as Application
          setApplications((prev) => ({
            ...prev,
            [row.job_id]: row.status,
          }))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase])

  // Upsert application status
  const setStatus = useCallback(async (jobId: string, status: ApplicationStatus | '') => {
    if (!userId) return

    if (!status) {
      // Delete the row if status cleared
      await supabase.from('applications').delete()
        .eq('user_id', userId).eq('job_id', jobId)
      setApplications((prev) => {
        const next = { ...prev }
        delete next[jobId]
        return next
      })
      return
    }

    await supabase.from('applications').upsert(
      { user_id: userId, job_id: jobId, status },
      { onConflict: 'user_id,job_id' }
    )
    setApplications((prev) => ({ ...prev, [jobId]: status }))
  }, [userId, supabase])

  return { applications, loading, setStatus }
}
