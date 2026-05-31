"use client";

import { User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import ProfileForm from "@/components/profile/ProfileForm";
import { motion } from "framer-motion";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col relative overflow-hidden font-sans">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="glass border-b border-glass-border px-6 py-4 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-semibold hidden md:inline">Back to Dashboard</span>
          </Link>
        </div>
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-neon" /> My Profile
          </h1>
        </div>
        <div className="w-24"></div> {/* Spacer to center title */}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-8 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl border border-glass-border shadow-2xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-8 border-b border-glass-border flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-neon/10 border-2 border-neon/50 flex items-center justify-center flex-shrink-0">
              <User className="w-10 h-10 text-neon" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Academic & Career Profile</h2>
              <p className="text-slate-400 text-sm">Update your details to personalize your mock interviews and job recommendations.</p>
            </div>
          </div>
          
          <ProfileForm />
        </motion.div>
      </main>
    </div>
  );
}
