'use client'

import { createClient } from '@/lib/supabase/client'

import { motion } from 'framer-motion'

export default function LoginPage() {
  const supabase = createClient()


  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { hd: 'iitkgp.ac.in' }, // hint for college email — not enforced
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-10 w-full max-w-md mx-4 text-center relative z-10"
      >
        {/* Logo */}
        <div className="text-5xl mb-4">🎓</div>
        <h1 className="text-2xl font-bold text-white mb-1">PlacementIQ</h1>
        <p className="text-slate-400 text-sm mb-2">IIT Kharagpur · Placement Hub</p>
        <span className="neon-badge mb-8 inline-block">KGP Exclusive Beta</span>

        <div className="my-8 border-t border-glass-border" />

        <p className="text-slate-300 text-sm mb-6">
          Sign in with your Google account to save your application status, track progress, and access company prep resources.
        </p>

        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold rounded-xl py-3 px-6 hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
        >
          {/* Google icon SVG */}
          <svg className="w-5 h-5" viewBox="0 0 48 48">
            <path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.1 33.8 29.6 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6-6C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 19.5-7.5 21-17.5.2-1.2.3-2.5.3-3.7 0-1.2-.1-2.4-.3-3.5z"/>
            <path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 15.9 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6-6C34.6 5.1 29.6 3 24 3 16.3 3 9.7 7.9 6.3 14.7z"/>
            <path fill="#FBBC05" d="M24 45c5.5 0 10.5-1.9 14.4-5l-6.7-5.5C29.5 36 26.9 37 24 37c-5.5 0-10.2-3.8-11.7-8.9l-7 5.4C8.5 40.9 15.7 45 24 45z"/>
            <path fill="#EA4335" d="M44.5 20H24v8.5h11.7c-.7 2.9-2.6 5.3-5.2 6.8l6.7 5.5c4-3.7 6.3-9.2 6.3-15.8 0-1.2-.1-2.4-.3-3.5z"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-slate-500 text-xs mt-6">
          By signing in, you agree that your application data is stored securely in our database.
          All data is private and visible only to you.
        </p>
      </motion.div>
    </div>
  )
}
