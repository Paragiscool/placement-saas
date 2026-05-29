"use client";

import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Target, TrendingUp, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface Interview {
  id: string;
  created_at: string;
  job_id: string;
  scorecard: any;
  jobs?: {
    company: string;
    role: string;
  };
}

export default function ProgressSection({ interviews }: { interviews: Interview[] }) {
  // Only consider interviews that have a completed scorecard
  const completedInterviews = useMemo(() => {
    return interviews.filter(i => i.scorecard && i.scorecard.technical_depth_score != null);
  }, [interviews]);

  const chartData = useMemo(() => {
    return completedInterviews.map((i, index) => {
      const date = new Date(i.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return {
        name: `Session ${index + 1} (${date})`,
        score: i.scorecard.technical_depth_score,
      };
    });
  }, [completedInterviews]);

  if (completedInterviews.length === 0) {
    return null; // Don't show progress section if no completed interviews
  }

  const renderVerdictBadge = (verdict: string) => {
    if (!verdict) return null;
    if (verdict.includes("Strong Hire")) return <span className="text-green-400 font-bold text-xs uppercase tracking-wider">{verdict}</span>;
    if (verdict.includes("Lean Hire")) return <span className="text-yellow-400 font-bold text-xs uppercase tracking-wider">{verdict}</span>;
    return <span className="text-red-400 font-bold text-xs uppercase tracking-wider">{verdict}</span>;
  };

  return (
    <section className="mb-12 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-neon" /> My Interview Progress
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Tracking your technical performance across {completedInterviews.length} mock sessions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Card */}
        <div className="lg:col-span-2 glass-card rounded-2xl border border-glass-border p-6 shadow-lg relative overflow-hidden">
          <div className="absolute top-[-50%] left-[-10%] w-[50%] h-[100%] bg-neon/10 blur-[100px] pointer-events-none" />
          <h3 className="text-lg font-bold text-white mb-6 relative z-10 flex items-center gap-2">
            Technical Depth Trajectory
          </h3>
          <div className="h-64 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  domain={[0, 10]} 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                  ticks={[0, 2, 4, 6, 8, 10]}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0a0f1e", borderColor: "#1e293b", borderRadius: "8px" }}
                  itemStyle={{ color: "#00f0ff" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#00f0ff" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: "#0a0f1e", stroke: "#00f0ff", strokeWidth: 2 }} 
                  activeDot={{ r: 6, fill: "#00f0ff" }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* History Grid */}
        <div className="glass-card rounded-2xl border border-glass-border p-6 shadow-lg flex flex-col h-full">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            Recent Sessions
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {completedInterviews.slice().reverse().map((interview, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={interview.id} 
                className="bg-black/40 border border-glass-border rounded-xl p-4 hover:border-neon/50 transition-colors group cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-white font-bold text-sm">
                      {interview.jobs?.company || "General"}
                    </h4>
                    <p className="text-slate-400 text-xs">{interview.jobs?.role || "Software Engineering"}</p>
                  </div>
                  <div className="bg-white/5 border border-glass-border rounded px-2 py-1 flex items-center gap-1">
                    <Target className="w-3 h-3 text-neon" />
                    <span className="text-white text-xs font-bold">{interview.scorecard.technical_depth_score}/10</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-end mt-4">
                  {renderVerdictBadge(interview.scorecard.final_verdict)}
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-neon transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
