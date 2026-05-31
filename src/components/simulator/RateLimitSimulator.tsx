"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, AlertTriangle, CheckCircle2, Clock, Zap, Activity } from 'lucide-react';

type Strategy = 'linear' | 'exponential' | 'token_bucket';
type ReqStatus = 'pending' | 'processing' | 'success' | 'failed_429' | 'waiting';

interface RequestItem {
  id: number;
  status: ReqStatus;
  attempts: number;
}

const TOTAL_REQUESTS = 30;
// Simulate an API that allows 5 requests per second (300 RPM) to make the visualization fast
const API_MAX_TOKENS = 5; 
const API_REFILL_MS = 1000; 

// Helpers
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export default function RateLimitSimulator() {
  const [strategy, setStrategy] = useState<Strategy>('linear');
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState({ success: 0, errors429: 0, timeElapsedMs: 0 });
  
  // Refs for background simulation loops
  const apiTokensRef = useRef(API_MAX_TOKENS);
  const isRunningRef = useRef(false);
  const startTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Client Token Bucket State (for the Token Bucket strategy)
  const clientTokensRef = useRef(API_MAX_TOKENS);

  useEffect(() => {
    resetSimulation();
    return () => {
      isRunningRef.current = false;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const resetSimulation = () => {
    isRunningRef.current = false;
    setIsRunning(false);
    setRequests(Array.from({ length: TOTAL_REQUESTS }, (_, i) => ({
      id: i,
      status: 'pending',
      attempts: 0
    })));
    setStats({ success: 0, errors429: 0, timeElapsedMs: 0 });
    apiTokensRef.current = API_MAX_TOKENS;
    clientTokensRef.current = API_MAX_TOKENS;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const updateRequest = (id: number, updater: (req: RequestItem) => RequestItem) => {
    setRequests(prev => prev.map(r => r.id === id ? updater(r) : r));
  };

  const increment429 = () => {
    setStats(s => ({ ...s, errors429: s.errors429 + 1 }));
  };
  const incrementSuccess = () => {
    setStats(s => ({ ...s, success: s.success + 1 }));
  };

  // --- MOCK API ---
  const mockApiCall = async () => {
    await sleep(50 + Math.random() * 50); // 50-100ms network latency
    if (apiTokensRef.current >= 1) {
      apiTokensRef.current -= 1;
      return 200;
    }
    return 429;
  };

  // --- STRATEGIES ---
  const processLinear = async (reqId: number) => {
    let delay = 1000; // Fixed 1s delay on failure
    while (isRunningRef.current) {
      updateRequest(reqId, r => ({ ...r, status: 'processing', attempts: r.attempts + 1 }));
      const status = await mockApiCall();
      
      if (status === 200) {
        updateRequest(reqId, r => ({ ...r, status: 'success' }));
        incrementSuccess();
        return;
      } else {
        updateRequest(reqId, r => ({ ...r, status: 'failed_429' }));
        increment429();
        updateRequest(reqId, r => ({ ...r, status: 'waiting' }));
        await sleep(delay);
      }
    }
  };

  const processExponential = async (reqId: number) => {
    let retryCount = 0;
    const baseDelay = 200;
    
    while (isRunningRef.current) {
      updateRequest(reqId, r => ({ ...r, status: 'processing', attempts: r.attempts + 1 }));
      const status = await mockApiCall();
      
      if (status === 200) {
        updateRequest(reqId, r => ({ ...r, status: 'success' }));
        incrementSuccess();
        return;
      } else {
        updateRequest(reqId, r => ({ ...r, status: 'failed_429' }));
        increment429();
        updateRequest(reqId, r => ({ ...r, status: 'waiting' }));
        
        // Exp Backoff + Jitter
        const delay = (Math.pow(2, retryCount) * baseDelay) + (Math.random() * 100);
        await sleep(delay);
        retryCount++;
      }
    }
  };

  const consumeClientToken = async () => {
    while (isRunningRef.current) {
      if (clientTokensRef.current >= 1) {
        clientTokensRef.current -= 1;
        return;
      }
      await sleep(50); // poll every 50ms until token available
    }
  };

  const processTokenBucket = async (reqId: number) => {
    while (isRunningRef.current) {
      updateRequest(reqId, r => ({ ...r, status: 'waiting' }));
      // Hug the API boundary perfectly
      await consumeClientToken();
      
      updateRequest(reqId, r => ({ ...r, status: 'processing', attempts: r.attempts + 1 }));
      const status = await mockApiCall();
      
      if (status === 200) {
        updateRequest(reqId, r => ({ ...r, status: 'success' }));
        incrementSuccess();
        return;
      } else {
        // In a perfect token bucket, we rarely hit 429 unless synchronized wrong
        updateRequest(reqId, r => ({ ...r, status: 'failed_429' }));
        increment429();
        await sleep(500); 
      }
    }
  };

  const startSimulation = () => {
    resetSimulation();
    setIsRunning(true);
    isRunningRef.current = true;
    startTimeRef.current = Date.now();

    // API Token Refill Loop
    const apiRefillInterval = setInterval(() => {
      if (!isRunningRef.current) {
        clearInterval(apiRefillInterval);
        return;
      }
      apiTokensRef.current = API_MAX_TOKENS;
    }, API_REFILL_MS);

    // Client Token Bucket Refill Loop (Synched to API limits)
    const clientRefillInterval = setInterval(() => {
      if (!isRunningRef.current) {
        clearInterval(clientRefillInterval);
        return;
      }
      clientTokensRef.current = Math.min(API_MAX_TOKENS, clientTokensRef.current + API_MAX_TOKENS);
    }, API_REFILL_MS);

    // Timer Interval
    timerIntervalRef.current = setInterval(() => {
      setStats(s => ({ ...s, timeElapsedMs: Date.now() - startTimeRef.current }));
      
      // Auto-stop if all success
      setRequests(currentReqs => {
        if (currentReqs.every(r => r.status === 'success') && isRunningRef.current) {
           isRunningRef.current = false;
           setIsRunning(false);
           clearInterval(apiRefillInterval);
           clearInterval(clientRefillInterval);
           if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
        return currentReqs;
      });
    }, 100);

    // Fire off all requests simultaneously to cause a burst
    for (let i = 0; i < TOTAL_REQUESTS; i++) {
      if (strategy === 'linear') {
        processLinear(i);
      } else if (strategy === 'exponential') {
        processExponential(i);
      } else {
        processTokenBucket(i);
      }
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl shadow-2xl">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-400" />
            API Quota Simulator
          </h2>
          <p className="text-slate-400 text-sm">Target API Limit: 5 Requests / Second</p>
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            disabled={isRunning}
            value={strategy} 
            onChange={e => setStrategy(e.target.value as Strategy)}
            className="bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
          >
            <option value="linear">Linear Delay (Fixed Sleep)</option>
            <option value="exponential">Exponential Backoff + Jitter</option>
            <option value="token_bucket">Token Bucket (Optimal Throughput)</option>
          </select>
          
          <button 
            onClick={isRunning ? resetSimulation : startSimulation}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all ${
              isRunning 
                ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/50' 
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.4)]'
            }`}
          >
            {isRunning ? (
              <><RotateCcw className="w-4 h-4" /> Stop</>
            ) : (
              <><Play className="w-4 h-4 fill-current" /> Start Simulation</>
            )}
          </button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
          <div className="text-4xl font-bold text-white">{stats.success} <span className="text-lg text-slate-500 font-normal">/ {TOTAL_REQUESTS}</span></div>
          <div className="text-slate-400 font-medium mt-1">Successful Requests</div>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <AlertTriangle className="w-8 h-8 text-rose-400 mb-2" />
          <div className="text-4xl font-bold text-white">{stats.errors429}</div>
          <div className="text-slate-400 font-medium mt-1">429 Rate Limits Hit</div>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Clock className="w-8 h-8 text-cyan-400 mb-2" />
          <div className="text-4xl font-bold text-white">{(stats.timeElapsedMs / 1000).toFixed(1)}s</div>
          <div className="text-slate-400 font-medium mt-1">Elapsed Time</div>
        </div>
      </div>

      {/* Visualization Grid */}
      <div className="bg-slate-950 border border-slate-800 p-8 rounded-2xl shadow-inner">
        <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
          {requests.map(req => (
            <div 
              key={req.id} 
              className={`
                aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-300 relative
                ${req.status === 'pending' ? 'bg-slate-800 border border-slate-700' : ''}
                ${req.status === 'processing' ? 'bg-indigo-500/20 border border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-110 z-10' : ''}
                ${req.status === 'waiting' ? 'bg-amber-500/20 border border-amber-500/50' : ''}
                ${req.status === 'failed_429' ? 'bg-rose-500/20 border border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)] scale-105 z-10' : ''}
                ${req.status === 'success' ? 'bg-emerald-500/20 border border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : ''}
              `}
            >
              {req.status === 'processing' && <Zap className="w-5 h-5 text-indigo-400 animate-pulse" />}
              {req.status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {req.status === 'failed_429' && <AlertTriangle className="w-5 h-5 text-rose-400" />}
              {req.status === 'waiting' && <Clock className="w-5 h-5 text-amber-400" />}
              {req.status === 'pending' && <span className="text-slate-500 font-mono text-xs">#{req.id + 1}</span>}
              
              {req.attempts > 0 && req.status !== 'success' && (
                 <span className="absolute -top-2 -right-2 bg-slate-800 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border border-slate-600">
                    {req.attempts}
                 </span>
              )}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-700" /> <span className="text-sm text-slate-400">Pending</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" /> <span className="text-sm text-slate-400">Processing</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]" /> <span className="text-sm text-slate-400">429 Rate Limit</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /> <span className="text-sm text-slate-400">Backing Off / Waiting</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /> <span className="text-sm text-slate-400">Success</span></div>
        </div>
      </div>
      
    </div>
  );
}
