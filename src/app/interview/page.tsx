"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Target, Brain, MessageSquare, Play } from "lucide-react";
import Link from "next/link";

interface Message {
  role: "user" | "ai";
  content: string;
}

interface Job {
  id: string;
  company: string;
  role: string;
}

interface Scorecard {
  technical_depth_score: number;
  communication_score: number;
  problem_solving_score: number;
  strengths: string[];
  areas_for_improvement: string[];
  final_verdict: string;
}

export default function InterviewRoom() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadInitialData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || "00000000-0000-0000-0000-000000000000");

      const { data: jobData } = await supabase.from("jobs").select("id, company, role").limit(100);
      if (jobData) setJobs(jobData);
    }
    loadInitialData();
  }, [supabase]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scorecard]);

  const getSelectedJobContext = () => {
    const job = jobs.find(j => j.id === selectedJobId);
    return job ? `${job.company} ${job.role}` : "General Software Engineering";
  };

  const handleStart = () => {
    if (!selectedJobId) return;
    setHasStarted(true);
    setMessages([
      {
        role: "ai",
        content: `Hello! I'm your Guiding Senior. Let's do a mock interview for the ${getSelectedJobContext()} role. Are you ready?`,
      },
    ]);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isEvaluating) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMsg,
          user_id: userId,
          job_id: selectedJobId,
          interview_id: interviewId,
          history: [...messages, { role: "user", content: userMsg }]
        }),
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "ai", content: data.reply }]);
      if (data.interview_id && !interviewId) {
        setInterviewId(data.interview_id);
      }
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
      const body: any = {
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        job_context: getSelectedJobContext(),
      };
      if (interviewId) body.interview_id = interviewId;
      if (userId) body.user_id = userId;

      const response = await fetch("http://localhost:8000/api/scorecard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  const renderVerdictBadge = (verdict: string) => {
    if (verdict.includes("Strong Hire")) return <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-4 py-1.5 rounded-full font-bold uppercase tracking-wider">{verdict}</span>;
    if (verdict.includes("Lean Hire")) return <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-4 py-1.5 rounded-full font-bold uppercase tracking-wider">{verdict}</span>;
    return <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-1.5 rounded-full font-bold uppercase tracking-wider">{verdict}</span>;
  };

  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0f1e] p-6 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-neon/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />
        
        <Link href="/" className="absolute top-8 left-8 text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
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
              <p className="text-slate-400 text-sm">Select a role to begin</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Target Role / Company</label>
              <select 
                className="w-full bg-black/40 border border-glass-border rounded-xl p-3 text-white focus:ring-2 focus:ring-neon/50 focus:border-neon outline-none transition-all appearance-none"
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
              >
                <option value="" disabled className="bg-gray-900">Select a Job...</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id} className="bg-gray-900">{job.company} - {job.role}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={handleStart}
              disabled={!selectedJobId}
              className="w-full bg-neon text-black hover:bg-neon/90 disabled:bg-slate-700 disabled:text-slate-400 font-bold py-3 px-4 rounded-xl transition-all shadow-[0_0_20px_rgba(0,240,255,0.2)] hover:shadow-[0_0_25px_rgba(0,240,255,0.4)] disabled:shadow-none flex items-center justify-center gap-2"
            >
              Start Interview
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a0f1e] text-slate-100 font-sans relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-1/2 h-1/3 bg-neon/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="glass border-b border-glass-border px-6 py-4 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
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
            /* Chat Mode */
            <motion.div 
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-6 pb-20"
            >
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-sm ${
                      msg.role === "user"
                        ? "bg-neon/10 border border-neon/20 text-white rounded-br-none"
                        : "bg-white/5 border border-glass-border text-slate-200 rounded-bl-none"
                    }`}
                  >
                    <div className="prose prose-invert prose-sm md:prose-base max-w-none prose-pre:bg-black/50 prose-pre:border prose-pre:border-glass-border">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || "");
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                className="rounded-lg my-3 !bg-black/40 border border-glass-border"
                                {...props}
                              >
                                {String(children).replace(/\n$/, "")}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={`${inline ? "bg-white/10 text-neon px-1.5 py-0.5 rounded text-sm" : ""}`} {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-glass-border rounded-2xl rounded-bl-none px-5 py-4 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-neon/60 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-neon/60 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></div>
                    <div className="w-2 h-2 bg-neon/60 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </motion.div>
          ) : (
            /* Scorecard Mode */
            <motion.div 
              key="scorecard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 25 }}
              className="max-w-4xl mx-auto pb-10"
            >
              <div className="glass-card rounded-2xl overflow-hidden shadow-2xl border border-glass-border">
                {/* Scorecard Header */}
                <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-b border-glass-border p-8 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  <h2 className="text-3xl font-bold text-white mb-2 relative z-10">Interview Evaluation</h2>
                  <p className="text-slate-300 mb-6 relative z-10">{getSelectedJobContext()}</p>
                  <div className="flex justify-center relative z-10">
                    {renderVerdictBadge(scorecard.final_verdict)}
                  </div>
                </div>

                <div className="p-8">
                  {/* Scores Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white/5 border border-glass-border rounded-xl p-5 text-center flex flex-col items-center justify-center">
                      <Brain className="w-6 h-6 text-purple-400 mb-3" />
                      <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold mb-1">Technical Depth</p>
                      <p className="text-4xl font-black text-white">{scorecard.technical_depth_score}<span className="text-xl text-slate-500 font-medium">/10</span></p>
                    </div>
                    <div className="bg-white/5 border border-glass-border rounded-xl p-5 text-center flex flex-col items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-blue-400 mb-3" />
                      <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold mb-1">Communication</p>
                      <p className="text-4xl font-black text-white">{scorecard.communication_score}<span className="text-xl text-slate-500 font-medium">/10</span></p>
                    </div>
                    <div className="bg-white/5 border border-glass-border rounded-xl p-5 text-center flex flex-col items-center justify-center">
                      <Target className="w-6 h-6 text-neon mb-3" />
                      <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold mb-1">Problem Solving</p>
                      <p className="text-4xl font-black text-white">{scorecard.problem_solving_score}<span className="text-xl text-slate-500 font-medium">/10</span></p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Strengths */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-glass-border pb-2">
                        <TrendingUp className="w-5 h-5 text-green-400" /> Key Strengths
                      </h3>
                      <ul className="space-y-3">
                        {scorecard.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-3 bg-green-500/5 border border-green-500/10 p-3 rounded-lg">
                            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-slate-300 text-sm leading-relaxed">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Areas for Improvement */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-glass-border pb-2">
                        <TrendingDown className="w-5 h-5 text-red-400" /> Areas for Improvement
                      </h3>
                      <ul className="space-y-3">
                        {scorecard.areas_for_improvement.map((a, i) => (
                          <li key={i} className="flex items-start gap-3 bg-red-500/5 border border-red-500/10 p-3 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <span className="text-slate-300 text-sm leading-relaxed">{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Input Area (Hidden during scorecard mode) */}
      {!scorecard && (
        <footer className="glass border-t border-glass-border p-4 sticky bottom-0 z-20">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSend} className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your response or write code..."
                className="w-full bg-black/50 border border-glass-border rounded-xl py-3.5 pl-5 pr-14 text-white focus:outline-none focus:border-neon/50 transition-all placeholder:text-slate-500"
                disabled={isLoading || isEvaluating}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading || isEvaluating}
                className="absolute right-2 p-2 bg-neon text-black hover:bg-neon/90 disabled:bg-white/10 disabled:text-slate-500 rounded-lg transition-colors flex items-center justify-center w-10 h-10 shadow-[0_0_10px_rgba(0,240,255,0.2)] disabled:shadow-none"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </div>
        </footer>
      )}
    </div>
  );
}
