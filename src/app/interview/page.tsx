"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { createBrowserClient } from "@supabase/ssr";

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
  technical_depth: string;
  communication: string;
  feedback: string;
}

export default function InterviewRoom() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // New State for Session Persistence and Scorecard
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  
  // Use a ref to ensure we don't recreate the client on every render
  const supabaseRef = useRef(createBrowserClient(supabaseUrl, supabaseKey));
  const supabase = supabaseRef.current;

  useEffect(() => {
    // Fetch Jobs and User
    async function loadInitialData() {
      const { data: { user } } = await supabase.auth.getUser();
      // If no user is logged in, we use a fallback UUID to prevent crashing (useful for local dev testing)
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

  const handleStart = () => {
    if (!selectedJobId) return;
    setHasStarted(true);
    setMessages([
      {
        role: "ai",
        content: `Hello! I'm your Guiding Senior. Let's do a mock interview for the selected role. Are you ready?`,
      },
    ]);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

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
    try {
      const body: any = {};
      if (interviewId) {
        body.interview_id = interviewId;
      } else {
        body.transcript = messages;
      }
      const response = await fetch("http://localhost:8000/api/scorecard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      setScorecard(data);
    } catch (err) {
      console.error("Failed to fetch scorecard", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Setup Mock Interview</h1>
          <p className="text-gray-500 mb-6">Select a job context for the AI Guiding Senior.</p>
          
          <label className="block text-sm font-medium text-gray-700 mb-2">Target Role / Company</label>
          <select 
            className="w-full border border-gray-300 rounded-lg p-3 mb-6 focus:ring-2 focus:ring-blue-500 outline-none"
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
          >
            <option value="" disabled>Select a Job...</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>{job.company} - {job.role}</option>
            ))}
          </select>

          <button 
            onClick={handleStart}
            disabled={!selectedJobId}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md"
          >
            Start Interview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Mock Interview Room</h1>
          <p className="text-sm text-gray-500">PlacementIQ AI • Guiding Senior Persona</p>
        </div>
        <div className="flex items-center gap-3">
          {hasStarted && !scorecard && (
             <button 
               onClick={handleEndInterview} 
               disabled={isEvaluating}
               className="px-4 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-bold rounded-lg border border-red-200 transition-colors shadow-sm"
             >
               {isEvaluating ? "Evaluating..." : "End & Evaluate"}
             </button>
          )}
          <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200 shadow-sm">
            Active
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
                }`}
              >
                {/* Markdown Renderer with Syntax Highlighting */}
                <div className="prose prose-sm md:prose-base prose-pre:bg-gray-900 prose-pre:p-0 max-w-none text-current">
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
                            className="rounded-md my-2"
                            {...props}
                          >
                            {String(children).replace(/\n$/, "")}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={`${inline ? "bg-gray-100 text-red-500 px-1 py-0.5 rounded" : ""}`} {...props}>
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

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-5 py-4 shadow-sm flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          )}

          {/* Scorecard Display */}
          {scorecard && (
            <div className="mt-8 bg-white rounded-xl shadow-lg border border-purple-200 overflow-hidden animate-fade-in">
              <div className="bg-purple-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Post-Game Scorecard</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-purple-600 font-semibold uppercase">Technical Depth</p>
                    <p className="text-3xl font-bold text-purple-900 mt-1">{scorecard.technical_depth}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-blue-600 font-semibold uppercase">Communication</p>
                    <p className="text-3xl font-bold text-blue-900 mt-1">{scorecard.communication}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">Actionable Feedback</h3>
                  <p className="text-gray-600 leading-relaxed">{scorecard.feedback}</p>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-gray-200 p-4 sticky bottom-0">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={scorecard ? "Interview ended." : "Type your response or ask a question..."}
              className="w-full bg-gray-50 border border-gray-300 rounded-full py-3 pl-6 pr-14 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={isLoading || !!scorecard}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || !!scorecard}
              className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-full transition-colors flex items-center justify-center w-10 h-10 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-1">
                <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
              </svg>
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-2">
            AI can make mistakes. Verify technical concepts before Day 1.
          </p>
        </div>
      </footer>
    </div>
  );
}
