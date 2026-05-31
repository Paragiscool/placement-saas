"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, ArrowLeft, Bot, User, Sparkles } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ChatWithSenior() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your **Guiding Senior** 🎓\n\nI have access to real interview experiences, compensation data, and preparation strategies from IIT KGP seniors. Ask me anything!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_BASE}/api/rag-query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage }),
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer || data.reply || "I couldn't find a relevant answer. Try rephrasing your question." },
      ]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I lost connection to the server. Please check if the backend is running and try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-surface relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/3 w-1/3 h-1/4 bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-1/4 h-1/4 bg-neon/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="glass border-b border-glass-border px-6 py-4 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-semibold hidden md:inline">Dashboard</span>
          </Link>
          <div className="h-6 w-px bg-glass-border hidden md:block" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
              <Bot className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                Chat with Senior
                <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-bold rounded-full border border-purple-500/20">
                  RAG
                </span>
              </h1>
              <p className="text-xs text-slate-400">Powered by RAG Intelligence · IIT KGP Knowledge Base</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 z-10 relative">
        <div className="max-w-3xl mx-auto space-y-5">
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className="flex items-start gap-3 max-w-[85%]">
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-5 py-4 shadow-sm ${
                    msg.role === "user"
                      ? "bg-neon/10 border border-neon/20 text-white rounded-br-none"
                      : "bg-white/5 border border-glass-border text-slate-200 rounded-bl-none"
                  }`}
                >
                  <div className="prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-strong:text-white">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-neon/10 border border-neon/30 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-neon" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div className="bg-white/5 border border-glass-border rounded-2xl rounded-bl-none px-5 py-4 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400/60 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400/60 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></div>
                  <div className="w-2 h-2 bg-purple-400/60 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="glass border-t border-glass-border p-4 z-10 relative">
        <form onSubmit={sendMessage} className="max-w-3xl mx-auto relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about interview rounds, compensation, preparation tips..."
            className="w-full bg-black/50 border border-glass-border rounded-xl py-3.5 pl-5 pr-14 text-white focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/30 transition-all placeholder:text-slate-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-2 bg-purple-500 text-white hover:bg-purple-400 disabled:bg-white/10 disabled:text-slate-500 rounded-lg transition-colors flex items-center justify-center w-10 h-10 shadow-[0_0_10px_rgba(168,85,247,0.2)] disabled:shadow-none"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
        <p className="text-center text-slate-600 text-xs mt-2 max-w-3xl mx-auto">
          Answers are generated from real IIT KGP senior interview experiences. Always verify critical information.
        </p>
      </div>
    </div>
  );
}
