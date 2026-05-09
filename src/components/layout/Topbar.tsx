'use client'

import { useUser } from '@/hooks/useUser'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function Topbar() {
  const { user, loading, signOut } = useUser()
  const supabase = createClient()

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <header className="sticky top-0 z-50 glass border-b border-glass-border">
      <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mr-4">
          <span className="text-2xl">🎓</span>
          <div className="leading-tight">
            <span className="text-white font-bold text-sm">PlacementIQ</span>
            <p className="text-[10px] text-slate-500 -mt-0.5">IIT Kharagpur</p>
          </div>
          <span className="neon-badge hidden sm:inline-block ml-1">KGP Beta</span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="topbar-search"
              type="text"
              placeholder="Search companies, roles…"
              className="w-full bg-white/5 border border-glass-border rounded-lg pl-9 pr-4 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon/30 transition-all"
              onChange={(e) => {
                // Dispatch custom event that JobTable can listen to
                window.dispatchEvent(new CustomEvent('topbar-search', { detail: e.target.value }))
              }}
            />
          </div>
        </div>

        <div className="flex-1" />

        {/* Auth */}
        {loading ? (
          <div className="w-8 h-8 skeleton rounded-full" />
        ) : user ? (
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm hidden md:block">{user.user_metadata?.full_name?.split(' ')[0]}</span>
            {user.user_metadata?.avatar_url ? (
              <button onClick={signOut} title="Sign out" className="ring-2 ring-glass-border hover:ring-neon rounded-full transition-all">
                <Image
                  src={user.user_metadata.avatar_url}
                  alt="avatar"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              </button>
            ) : (
              <button
                onClick={signOut}
                className="w-8 h-8 rounded-full bg-neon/20 border border-neon/30 text-neon text-sm font-semibold flex items-center justify-center hover:bg-neon/30 transition-all"
              >
                {user.email?.[0].toUpperCase()}
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={handleGoogleLogin}
            className="flex items-center gap-2 bg-neon/10 border border-neon/30 text-neon hover:bg-neon/20 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all hover:shadow-neon-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
            </svg>
            Sign in
          </button>
        )}
      </div>
    </header>
  )
}
