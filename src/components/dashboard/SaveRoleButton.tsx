'use client'

import { useState } from "react"
import { Bookmark } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface SaveRoleButtonProps {
  company: string
  role: string
  skills?: string
}

export default function SaveRoleButton({ company, role, skills }: SaveRoleButtonProps) {
  // Local state for the optimistic UI toggle
  const [isSaved, setIsSaved] = useState(false)
  const supabase = createClientComponentClient()

  const toggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevents the accordion from closing
    
    // 1. Instantly update UI (Optimistic Update)
    const newSavedState = !isSaved
    setIsSaved(newSavedState)

    // 2. Fetch the current logged-in user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return // If not logged in, we silently fail or could trigger a toast here

    // 3. Sync with Database in the background
    if (newSavedState) {
      // Insert bookmark
      await supabase.from("saved_roles").insert([
        { user_id: user.id, company, role, skills: skills || null }
      ])
    } else {
      // Remove bookmark
      await supabase.from("saved_roles")
        .delete()
        .match({ user_id: user.id, company, role })
    }
  }

  return (
    <button 
      onClick={toggleSave}
      className="text-slate-500 hover:text-white transition-colors ml-2"
      title={isSaved ? "Remove Bookmark" : "Save Role"}
    >
      <Bookmark 
        className={`w-5 h-5 transition-all ${isSaved ? "fill-blue-500 text-blue-500" : ""}`} 
      />
    </button>
  )
}
