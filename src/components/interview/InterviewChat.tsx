import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Send } from 'lucide-react'

interface Message {
  role: "user" | "ai"
  content: string
}

interface InterviewChatProps {
  messages: Message[]
  isLoading: boolean
  isEvaluating: boolean
  input: string
  setInput: (value: string) => void
  handleSend: (e: React.FormEvent) => void
}

export default function InterviewChat({
  messages,
  isLoading,
  isEvaluating,
  input,
  setInput,
  handleSend,
}: InterviewChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  return (
    <>
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
                      const match = /language-(\w+)/.exec(className || "")
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus as any}
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
                      )
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

      {/* Input Area */}
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
    </>
  )
}
