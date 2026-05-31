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
        const result = await response.json();
        
        if (result.data) {
          // Format data for Recharts, taking top 10 departments by volume
          const formatted = result.data.slice(0, 10).map((item: any) => ({
            name: item.department,
            "Median CTC (LPA)": item.median_ctc,
            "Max CTC (LPA)": item.max_ctc,
            Offers: item.total_offers,
          }));
          setData(formatted);
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
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#94a3b8" 
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₹${value}L`}
            />
            <Tooltip
              cursor={{ fill: '#ffffff0a' }}
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#fff',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar 
              dataKey="Median CTC (LPA)" 
              fill="#00f0ff" 
              radius={[4, 4, 0, 0]} 
              barSize={20} 
            />
            <Bar 
              dataKey="Max CTC (LPA)" 
              fill="#a855f7" 
              radius={[4, 4, 0, 0]} 
              barSize={20} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
