"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

interface AnalyticsData {
  department: string;
  role_type: string;
  median_ctc: number;
  max_ctc: number;
  total_offers: number;
}

export default function CompensationChart() {
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await fetch(`${API_BASE}/api/analytics`);
        if (!response.ok) throw new Error("Failed to fetch");
        const rawData = await response.json();
        
        if (rawData.data) {
          // 1. Sanitize, Trim, and Convert the Data
          const cleanDataMap = new Map();

          rawData.data.forEach((item: any) => {
            // Remove trailing/leading spaces from the department name
            const cleanDept = item.department ? item.department.trim() : "Unknown";
            
            // Normalize the data magnitude. 
            // The database contains a mix of absolute rupees (e.g., 5500000) and Lakhs (e.g., 22.5).
            // If the number is > 1000, we assume it's absolute and convert it to LPA.
            const rawMed = Number(item.median_ctc) || 0;
            const rawMax = Number(item.max_ctc) || 0;
            
            const medCtc = rawMed > 1000 ? rawMed / 100000 : rawMed;
            const maxCtc = rawMax > 1000 ? rawMax / 100000 : rawMax;

            if (cleanDataMap.has(cleanDept)) {
              // If we already have this department, update the max and average the medians (or keep highest)
              const existing = cleanDataMap.get(cleanDept);
              existing.max_ctc = Math.max(existing.max_ctc, maxCtc);
              existing.median_ctc = (existing.median_ctc + medCtc) / 2; // Simple merge
            } else {
              cleanDataMap.set(cleanDept, {
                department: cleanDept,
                median_ctc: medCtc,
                max_ctc: maxCtc,
              });
            }
          });

          // 2. Convert map back to array and feed to chart (limit to top 10 for clean UI)
          const finalData = Array.from(cleanDataMap.values()).slice(0, 10);
          console.log("FINAL CHART DATA:", finalData);
          setData(finalData);
        }
      } catch (err: any) {
        console.error("Failed to fetch analytics:", err);
        setError("Failed to load analytics.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-white/5 border border-glass-border rounded-2xl animate-pulse">
        <div className="w-10 h-10 border-4 border-neon border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="w-full h-[400px] flex flex-col items-center justify-center bg-white/5 border border-glass-border rounded-2xl">
        <p className="text-slate-400">No compensation data available yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[450px] bg-black/40 border border-glass-border rounded-2xl p-6 relative overflow-hidden shadow-2xl">
      <div className="absolute top-[-50%] left-[-10%] w-[50%] h-[100%] bg-neon/10 blur-[100px] pointer-events-none" />
      <h3 className="text-xl font-bold text-white mb-2 relative z-10">Live Compensation Analytics</h3>
      <p className="text-slate-400 text-sm mb-6 relative z-10">Real-time Median vs Max CTC aggregated across active roles</p>
      
      <div className="w-full h-[320px] relative z-10">
        <ResponsiveContainer width="100%" height={400}>
          {/* Added a left margin of 20 to push the chart away from the screen edge */}
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            
            <XAxis 
              dataKey="department" 
              stroke="#9ca3af" 
              fontSize={12} 
              tickMargin={10} 
            />
            
            {/* Explicitly setting width={60} gives the labels room to render without chopping */}
            <YAxis 
              width={60} 
              tickFormatter={(value) => `₹${value}L`} 
              stroke="#9ca3af" 
              fontSize={12} 
            />
            
            <Tooltip 
              cursor={{ fill: '#1f2937' }}
              contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6' }}
              formatter={(value: number) => [`₹${value.toFixed(1)} LPA`, '']}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }}/>
            
            <Bar dataKey="max_ctc" name="Max CTC (LPA)" fill="#a855f7" radius={[4, 4, 0, 0]} />
            <Bar dataKey="median_ctc" name="Median CTC (LPA)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
