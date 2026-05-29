"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, User, GraduationCap, Briefcase, Code, Loader2, Save, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState({
    full_name: "",
    roll_number: "",
    department: "",
    degree: "",
    cgpa: "",
    skills: "",
    target_roles: "",
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (data) {
          setProfile({
            full_name: data.full_name || "",
            roll_number: data.roll_number || "",
            department: data.department || "",
            degree: data.degree || "",
            cgpa: data.cgpa || "",
            skills: data.skills ? data.skills.join(", ") : "",
            target_roles: data.target_roles ? data.target_roles.join(", ") : "",
          });
        }
      } catch (err) {
        console.error("Error loading profile", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [supabase, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const updates = {
        id: user.id,
        full_name: profile.full_name,
        roll_number: profile.roll_number,
        department: profile.department,
        degree: profile.degree,
        cgpa: profile.cgpa,
        skills: profile.skills.split(",").map(s => s.trim()).filter(Boolean),
        target_roles: profile.target_roles.split(",").map(s => s.trim()).filter(Boolean),
      };

      const { error } = await supabase.from("profiles").upsert(updates);
      if (error) throw error;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-neon animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col relative overflow-hidden font-sans">
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

          <form onSubmit={handleSave} className="p-8 space-y-6">
            
            {/* Personal Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-glass-border pb-2">
                <User className="w-4 h-4 text-blue-400" /> Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    value={profile.full_name}
                    onChange={handleChange}
                    placeholder="Parag Patle"
                    className="w-full bg-black/50 border border-glass-border rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Roll Number</label>
                  <input
                    type="text"
                    name="roll_number"
                    value={profile.roll_number}
                    onChange={handleChange}
                    placeholder="22NA30044"
                    className="w-full bg-black/50 border border-glass-border rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Academic Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-glass-border pb-2">
                <GraduationCap className="w-4 h-4 text-purple-400" /> Academic Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={profile.department}
                    onChange={handleChange}
                    placeholder="Ocean Engineering & Naval Architecture"
                    className="w-full bg-black/50 border border-glass-border rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Degree</label>
                  <input
                    type="text"
                    name="degree"
                    value={profile.degree}
                    onChange={handleChange}
                    placeholder="Dual Degree (B.Tech + M.Tech)"
                    className="w-full bg-black/50 border border-glass-border rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">CGPA</label>
                  <input
                    type="text"
                    name="cgpa"
                    value={profile.cgpa}
                    onChange={handleChange}
                    placeholder="8.77"
                    className="w-full bg-black/50 border border-glass-border rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Career Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-glass-border pb-2">
                <Briefcase className="w-4 h-4 text-green-400" /> Career Alignment
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Target Roles (Comma separated)</label>
                  <input
                    type="text"
                    name="target_roles"
                    value={profile.target_roles}
                    onChange={handleChange}
                    placeholder="Software Engineer, Data Scientist, Quant"
                    className="w-full bg-black/50 border border-glass-border rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Key Skills (Comma separated)</label>
                  <input
                    type="text"
                    name="skills"
                    value={profile.skills}
                    onChange={handleChange}
                    placeholder="Python, C++, SQL, LangGraph"
                    className="w-full bg-black/50 border border-glass-border rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Profile saved successfully!
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-neon text-black hover:bg-neon/90 disabled:opacity-50 font-bold py-3 px-8 rounded-xl transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:shadow-[0_0_25px_rgba(0,240,255,0.4)] flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Changes
              </button>
            </div>
            
          </form>
        </motion.div>
      </main>
    </div>
  );
}
