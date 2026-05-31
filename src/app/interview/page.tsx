"use client";

import React, { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import InterviewChat from "@/components/interview/InterviewChat";
import ScorecardView from "@/components/interview/ScorecardView";

interface Message {
  role: "user" | "ai";
  content: string;
}

interface Scorecard {
  technical_depth_score: number;
  communication_score: number;
  problem_solving_score: number;
  strengths: string[];
  areas_for_improvement: string[];
  final_verdict: string;
}

function InterviewRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const targetCompany = searchParams.get("company") || "";
  const targetRole = searchParams.get("role") || "";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [hasStarted, setHasStarted] = useState(false);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supabase = createClient();

  const getSelectedJobContext = () => {
    return targetCompany ? `${targetCompany} - ${targetRole}` : "General Engineering";
  };

  const startMockInterview = async () => {
    setHasStarted(true);
    setIsLoading(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/mock-interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          company: targetCompany,
          role: targetRole,
          messages: []
        }),
      });

      if (!response.ok) throw new Error("Backend error");
      const data = await response.json();
      setMessages([{ role: "ai", content: data.response }]);
    } catch (error) {
      setMessages([{ role: "ai", content: "Oops, looks like my connection dropped. Can you refresh?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-start if company and role are provided in the URL
  useEffect(() => {
    if (targetCompany && targetRole && !hasStarted && !isLoading) {
      startMockInterview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetCompany, targetRole]);

  const handleStartManual = () => {
    startMockInterview();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isEvaluating) return;

    const userMsg = input.trim();
    setInput("");
    
    const newMessages = [...messages, { role: "user" as const, content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/mock-interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          company: targetCompany,
          role: targetRole,
          messages: newMessages
        }),
      });

      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "ai", content: data.response }]);
      
    } catch (error) {
      console.error("Error fetching AI response:", error);
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Oops, looks like my connection dropped. Can you repeat that?" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndInterview = async () => {
    setIsEvaluating(true);
    setErrorMessage(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const { data: { user } } = await supabase.auth.getUser();

      const body: any = {
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        job_context: getSelectedJobContext(),
      };
      if (user) body.user_id = user.id;

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/scorecard`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (data.status === "success" && data.scorecard) {
        setScorecard(data.scorecard);
      } else {
        console.error("Failed to generate scorecard:", data.message);
        setErrorMessage(data.message || data.error || "Failed to generate scorecard. Please try again.");
      }
    } catch (err: any) {
      console.error("Failed to fetch scorecard", err);
      setErrorMessage(err.message || "Failed to connect to backend server.");
    } finally {
      setIsEvaluating(false);
    }
  };

  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface p-6 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-neon/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />
        
        <Link href="/dashboard" className="absolute top-8 left-8 text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card max-w-md w-full p-8 relative z-10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-neon/10 border border-neon/30 flex items-center justify-center">
              <Play className="w-6 h-6 text-neon" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Mock Interview</h1>
              <p className="text-slate-400 text-sm">Launch from the dashboard roles</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <button 
              onClick={handleStartManual}
              className="w-full bg-neon text-black hover:bg-neon/90 font-bold py-3 px-4 rounded-xl transition-all shadow-[0_0_20px_rgba(0,240,255,0.2)] hover:shadow-[0_0_25px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2"
            >
              Start General Interview
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-surface text-slate-100 font-sans relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-1/2 h-1/3 bg-neon/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="glass border-b border-glass-border px-6 py-4 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-semibold hidden md:inline">Exit Interview</span>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Mock Interview Room
              <span className="px-2 py-0.5 bg-neon/10 text-neon text-[10px] font-bold rounded-full border border-neon/20">LIVE</span>
            </h1>
            <p className="text-xs text-slate-400">{getSelectedJobContext()}</p>
          </div>
        </div>
        <div>
          {!scorecard && (
             <button 
               onClick={handleEndInterview} 
               disabled={isEvaluating}
               className="px-5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-lg border border-red-500/30 transition-all shadow-sm flex items-center gap-2"
             >
               {isEvaluating ? (
                 <>
                   <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                   Evaluating...
                 </>
               ) : (
                 "End Interview & Get Scorecard"
               )}
             </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 z-10 relative">
        {errorMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm shadow-lg max-w-md w-full flex items-center gap-3 z-50 animate-fade-in">
             <AlertTriangle className="w-5 h-5 flex-shrink-0" />
             <span>{errorMessage}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {!scorecard ? (
            <InterviewChat
              key="chat"
              messages={messages}
              isLoading={isLoading}
              isEvaluating={isEvaluating}
              input={input}
              setInput={setInput}
              handleSend={handleSend}
            />
          ) : (
            <ScorecardView 
              key="scorecard" 
              scorecard={scorecard} 
              jobContext={getSelectedJobContext()} 
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function InterviewRoom() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface p-6">
        <div className="w-8 h-8 border-4 border-neon border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-neon font-bold animate-pulse">Initializing Interview Room...</p>
      </div>
    }>
      <InterviewRoomContent />
    </Suspense>
  )
}
