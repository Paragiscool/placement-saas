"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Building2,
  Briefcase,
  GraduationCap,
  Zap,
  TrendingUp,
  BookOpen,
  Wrench,
  BarChart3,
  ArrowLeft,
  Sparkles,
  Loader2,
  X,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────
interface RoleCard {
  company: string;
  role: string;
  schema_type: string;
  skills: string[];
  departments: string[];
  difficulty: string | null;
  hiring_volume: string | null;
  compensation_tier: string | null;
  description: string;
  similarity_score: number;
  document_id: string;
}

// ─── Schema badge config ────────────────────────────────────────────────────
const SCHEMA_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  interview: {
    label: "Interview",
    icon: <Briefcase className="w-3.5 h-3.5" />,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
  },
  compensation: {
    label: "Compensation",
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  prep_resource: {
    label: "Prep Resource",
    icon: <BookOpen className="w-3.5 h-3.5" />,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  osint_tool: {
    label: "OSINT Tool",
    icon: <Wrench className="w-3.5 h-3.5" />,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
  },
};

const DEPARTMENT_OPTIONS = [
  "All Departments",
  "Computer Science",
  "Electronics",
  "Mathematics",
  "Mechanical",
  "Physics",
  "Electrical",
  "Chemical",
  "Civil",
  "Biotechnology",
  "Ocean Engineering",
];

// ─── Main Component ─────────────────────────────────────────────────────────
export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("All Departments");
  const [minCgpa, setMinCgpa] = useState("");
  const [results, setResults] = useState<RoleCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const body: any = { query: query.trim() };
      if (department !== "All Departments") body.department = department;
      if (minCgpa) body.min_cgpa = parseFloat(minCgpa);

      const response = await fetch(`${API_BASE}/api/search-roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("Search request failed");

      const data = await response.json();
      setResults(data.results || []);
      setTotalResults(data.total || 0);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setDepartment("All Departments");
    setMinCgpa("");
    setResults([]);
    setHasSearched(false);
    setTotalResults(0);
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-surface relative overflow-hidden">
      {/* ── Background Ambience ────────────────────────────────────────── */}
      <div className="absolute top-0 left-1/4 w-1/2 h-1/3 bg-neon/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/3 w-1/3 h-1/4 bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="mb-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neon/20 to-purple-500/20 border border-neon/20 flex items-center justify-center">
              <Search className="w-6 h-6 text-neon" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Explore Roles
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Search across interviews, compensation data, prep resources & OSINT tools
              </p>
            </div>
          </div>
        </div>

        {/* ── Search & Filters ─────────────────────────────────────────── */}
        <form onSubmit={handleSearch} className="mb-8">
          {/* Main Search Bar */}
          <div className="relative mb-4">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <Search className="w-5 h-5 text-slate-500" />
            </div>
            <input
              id="explore-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by skill, company, role, technology…  (e.g. 'Dynamic Programming', 'Quant Finance', 'System Design')"
              className="w-full bg-black/40 border border-glass-border rounded-2xl pl-12 pr-14 py-4 text-white text-base placeholder:text-slate-500 focus:outline-none focus:border-neon/50 focus:ring-2 focus:ring-neon/20 transition-all shadow-glass"
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filters:</span>
            </div>

            {/* Department Dropdown */}
            <div className="relative">
              <select
                id="explore-department-filter"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="appearance-none bg-white/5 border border-glass-border rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-300 focus:outline-none focus:border-neon/40 focus:ring-1 focus:ring-neon/20 transition-all cursor-pointer"
              >
                {DEPARTMENT_OPTIONS.map((dept) => (
                  <option key={dept} value={dept} className="bg-surface-elevated text-white">
                    {dept}
                  </option>
                ))}
              </select>
              <GraduationCap className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>

            {/* CGPA Input */}
            <div className="relative">
              <input
                id="explore-cgpa-filter"
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={minCgpa}
                onChange={(e) => setMinCgpa(e.target.value)}
                placeholder="Min CGPA"
                className="w-32 bg-white/5 border border-glass-border rounded-xl px-4 py-2.5 text-sm text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-neon/40 focus:ring-1 focus:ring-neon/20 transition-all"
              />
            </div>

            {/* Search Button */}
            <button
              id="explore-search-button"
              type="submit"
              disabled={isLoading || !query.trim()}
              className="flex items-center gap-2 bg-gradient-to-r from-neon to-blue-500 hover:from-neon/90 hover:to-blue-500/90 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-black disabled:text-slate-400 font-bold px-6 py-2.5 rounded-xl transition-all shadow-neon-sm disabled:shadow-none text-sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              {isLoading ? "Searching…" : "Search"}
            </button>
          </div>
        </form>

        {/* ── Results Count Bar ────────────────────────────────────────── */}
        {hasSearched && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6 px-1"
          >
            <p className="text-sm text-slate-400">
              Found <span className="text-white font-semibold">{totalResults}</span>{" "}
              result{totalResults !== 1 ? "s" : ""} for{" "}
              <span className="text-neon font-medium">&ldquo;{query}&rdquo;</span>
            </p>
            {department !== "All Departments" && (
              <span className="text-xs px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full">
                {department}
              </span>
            )}
          </motion.div>
        )}

        {/* ── Loading Skeleton ─────────────────────────────────────────── */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="glass-card p-6 space-y-4 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 skeleton rounded" />
                    <div className="h-3 w-1/2 skeleton rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full skeleton rounded" />
                  <div className="h-3 w-4/5 skeleton rounded" />
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-20 skeleton rounded-full" />
                  <div className="h-6 w-16 skeleton rounded-full" />
                  <div className="h-6 w-24 skeleton rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Results Grid ─────────────────────────────────────────────── */}
        {!isLoading && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            <AnimatePresence>
              {results.map((role, idx) => (
                <RoleResultCard key={role.document_id} role={role} index={idx} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Empty State ──────────────────────────────────────────────── */}
        {!isLoading && hasSearched && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-glass-border flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">
              No results found
            </h3>
            <p className="text-sm text-slate-500 max-w-sm">
              Try broadening your search terms or adjusting your filters.
              For example, search &ldquo;machine learning&rdquo; or &ldquo;system design&rdquo;.
            </p>
          </motion.div>
        )}

        {/* ── Initial State (Before search) ────────────────────────────── */}
        {!hasSearched && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-neon/10 to-purple-500/10 border border-neon/10 flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10 text-neon/60" />
            </div>
            <h3 className="text-xl font-bold text-slate-200 mb-3">
              Search the Knowledge Base
            </h3>
            <p className="text-sm text-slate-500 max-w-lg leading-relaxed">
              Query across <span className="text-neon font-medium">interview experiences</span>,{" "}
              <span className="text-emerald-400 font-medium">compensation data</span>,{" "}
              <span className="text-amber-400 font-medium">prep resources</span>, and{" "}
              <span className="text-cyan-400 font-medium">OSINT tools</span>{" "}
              to find the roles and insights that matter to you.
            </p>

            {/* Quick search suggestions */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
              {["Dynamic Programming", "Quant Finance", "System Design", "Data Science", "C++ Low Latency"].map(
                (suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setQuery(suggestion);
                    }}
                    className="px-4 py-2 bg-white/5 border border-glass-border rounded-xl text-sm text-slate-400 hover:text-white hover:border-neon/30 hover:bg-neon/5 transition-all"
                  >
                    {suggestion}
                  </button>
                )
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}


// ─── Role Result Card ───────────────────────────────────────────────────────
function RoleResultCard({ role, index }: { role: RoleCard; index: number }) {
  const config = SCHEMA_CONFIG[role.schema_type] || SCHEMA_CONFIG.interview;

  // Map difficulty to visual badges
  const difficultyColors: Record<string, string> = {
    Easy: "text-green-400 bg-green-500/10 border-green-500/20",
    Medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    "Medium-Hard": "text-orange-400 bg-orange-500/10 border-orange-500/20",
    Hard: "text-red-400 bg-red-500/10 border-red-500/20",
    Extreme: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group glass-card p-6 hover:border-neon/20 hover:shadow-neon-sm transition-all duration-300 cursor-default"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center flex-shrink-0`}>
            <Building2 className={`w-5 h-5 ${config.color}`} />
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-bold text-base truncate group-hover:text-neon transition-colors">
              {role.company}
            </h3>
            <p className="text-slate-400 text-sm truncate">{role.role}</p>
          </div>
        </div>

        {/* Schema type badge */}
        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${config.bg} ${config.color} border ${config.border} flex-shrink-0`}>
          {config.icon}
          {config.label}
        </span>
      </div>

      {/* Description */}
      {role.description && (
        <p className="text-slate-400 text-xs leading-relaxed mb-4 line-clamp-2">
          {role.description}
        </p>
      )}

      {/* Metadata row */}
      <div className="flex flex-wrap gap-2 mb-4">
        {role.difficulty && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${difficultyColors[role.difficulty] || "text-slate-400 bg-white/5 border-glass-border"}`}>
            {role.difficulty}
          </span>
        )}
        {role.hiring_volume && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 border border-glass-border text-slate-400">
            {role.hiring_volume}
          </span>
        )}
        {role.compensation_tier && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            {role.compensation_tier}
          </span>
        )}
      </div>

      {/* Skills */}
      {role.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {role.skills.slice(0, 5).map((skill, i) => (
            <span
              key={i}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 border border-glass-border text-slate-300 hover:bg-neon/5 hover:border-neon/20 hover:text-white transition-all"
            >
              {skill.length > 30 ? skill.slice(0, 30) + "…" : skill}
            </span>
          ))}
          {role.skills.length > 5 && (
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-white/3 text-slate-500">
              +{role.skills.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* Similarity Score Bar */}
      <div className="mt-4 pt-3 border-t border-glass-border">
        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5">
          <span className="flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            Relevance
          </span>
          <span className="text-slate-400 font-mono">
            {(role.similarity_score * 100).toFixed(0)}%
          </span>
        </div>
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(role.similarity_score * 100, 100)}%` }}
            transition={{ duration: 0.6, delay: index * 0.05 + 0.3 }}
            className="h-full rounded-full bg-gradient-to-r from-neon to-purple-500"
          />
        </div>
      </div>
    </motion.div>
  );
}
