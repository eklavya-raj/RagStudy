"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, FileText, BookOpen, ListChecks, HelpCircle, Quote } from "lucide-react";
import { useChat } from "@/app/lib/hooks/useChat";
import { DEFAULT_MODEL } from "@/app/lib/models";
import ModelSelector from "@/app/components/ModelSelector";
import ChatBubble from "@/app/components/ChatBubble";
import ChatInput from "@/app/components/ChatInput";

const QUESTIONS = [
  { icon: BookOpen, label: "Summarize", prompt: "Give me a concise summary of this document." },
  { icon: ListChecks, label: "Key points", prompt: "List the most important key points from this document." },
  { icon: HelpCircle, label: "Quiz me", prompt: "Generate 5 study questions based on this document." },
  { icon: Quote, label: "Find quotes", prompt: "Pull out the most important quotes or definitions from this document." },
];

export default function ChatInterface({ documentId }: { documentId: string }) {
  const [model, setModel] = useState(DEFAULT_MODEL);
  const { messages, sending, error, bottomRef, sendMessage } = useChat({ documentId, model });
  const empty = messages.length === 0;

  return (
    <div className="relative flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-3xl opacity-60" />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {empty ? (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-8 flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-xl shadow-violet-600/40">
                <FileText size={28} className="text-white" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">
              Ask your document
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mb-10 leading-relaxed">
              Answers are grounded in the most relevant chunks of your file. Try one of these to get started:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {QUESTIONS.map(({ icon: Icon, label, prompt }) => (
                <button
                  key={label}
                  onClick={() => sendMessage(prompt)}
                  className="group flex items-start gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:bg-accent/40 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/30 transition-all text-left"
                >
                  <div className="shrink-0 w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                    <Icon size={16} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground mb-0.5">{label}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{prompt}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            {messages.map((msg, i) => (
              <ChatBubble key={i} message={msg} />
            ))}
            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        sending={sending}
        placeholder="Ask about this document…"
        footerControls={
          <>
            <Link
              href="/dashboard"
              className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all shrink-0"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={15} />
            </Link>
            <ModelSelector value={model} onChange={setModel} placement="top" align="left" />
          </>
        }
      />
    </div>
  );
}
