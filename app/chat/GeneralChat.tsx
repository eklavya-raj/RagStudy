"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Sparkles, AlertCircle, FileText, X, AtSign, Loader2, MessageSquare, Send, BookOpen, Code, Lightbulb, GraduationCap } from "lucide-react";
import { useChat } from "@/app/lib/hooks/useChat";
import { DEFAULT_MODEL } from "@/app/lib/models";
import { useAutoResize } from "@/app/lib/hooks/useAutoResize";
import type { Doc } from "@/app/lib/types";
import ModelSelector from "@/app/components/ModelSelector";
import ChatBubble from "@/app/components/ChatBubble";

const SUGGESTIONS = [
  { icon: GraduationCap, label: "Explain a concept", prompt: "Explain the concept of recursion with a simple example." },
  { icon: BookOpen, label: "Summarize a topic", prompt: "Give me a short summary of how transformers work in machine learning." },
  { icon: Code, label: "Write code", prompt: "Write a Python function that returns the n-th Fibonacci number using memoization." },
  { icon: Lightbulb, label: "Brainstorm ideas", prompt: "Brainstorm 5 study techniques that work well for memorizing dense material." },
];

export default function GeneralChat() {
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [attachedDoc, setAttachedDoc] = useState<Doc | null>(null);

  const { messages, sending, error, bottomRef, sendMessage } = useChat({
    documentId: attachedDoc?.id,
    model,
  });

  const empty = messages.length === 0;

  return (
    <div className="relative flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-3xl opacity-60" />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border/60 bg-background/70 backdrop-blur-xl shrink-0 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-md shadow-violet-600/30">
            <MessageSquare size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">New Chat</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Type @ to attach a document</p>
          </div>
        </div>
        <ModelSelector value={model} onChange={setModel} />
      </header>

      {/* Messages / hero */}
      <div className="flex-1 overflow-y-auto">
        {empty ? (
          <HeroEmpty onPick={sendMessage} />
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

      {/* Input with @-mention */}
      <GeneralChatInput
        sending={sending}
        onSend={sendMessage}
        attachedDoc={attachedDoc}
        onAttach={setAttachedDoc}
      />
    </div>
  );
}

/* ─── Hero empty state ─── */

function HeroEmpty({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-8 flex flex-col items-center text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full" />
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-xl shadow-violet-600/40">
          <Sparkles size={28} className="text-white" />
        </div>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">
        How can I help today?
      </h1>
      <p className="text-sm text-muted-foreground max-w-md mb-10 leading-relaxed">
        Ask anything, or type{" "}
        <kbd className="px-1.5 py-0.5 rounded-md bg-muted border border-border text-foreground font-mono text-[11px]">@</kbd>{" "}
        in the input below to chat with one of your{" "}
        <Link href="/dashboard" className="text-primary hover:underline underline-offset-2">documents</Link>.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        {SUGGESTIONS.map(({ icon: Icon, label, prompt }) => (
          <button
            key={label}
            onClick={() => onPick(prompt)}
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
  );
}

/* ─── Input with @-mention doc picker ─── */

interface InputProps {
  sending: boolean;
  onSend: (text: string) => void;
  attachedDoc: Doc | null;
  onAttach: (doc: Doc | null) => void;
}

function GeneralChatInput({ sending, onSend, attachedDoc, onAttach }: InputProps) {
  const { getToken } = useAuth();
  const [input, setInput] = useState("");
  const { ref: textareaRef, adjust, reset } = useAutoResize();
  const base = process.env.NEXT_PUBLIC_BACKEND_URL;

  const [docs, setDocs] = useState<Doc[]>([]);
  const [docsLoaded, setDocsLoaded] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [docQuery, setDocQuery] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  const fetchDocs = useCallback(async () => {
    if (docsLoaded) return;
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`${base}/api/documents`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setDocs(await res.json());
      setDocsLoaded(true);
    }
  }, [getToken, base, docsLoaded]);

  useEffect(() => {
    const m = input.match(/@(\w*)$/);
    if (m) {
      setDocQuery(m[1]);
      setShowPicker(true);
      fetchDocs();
    } else {
      setShowPicker(false);
    }
  }, [input, fetchDocs]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node))
        setShowPicker(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function selectDoc(doc: Doc) {
    onAttach(doc);
    setShowPicker(false);
    setInput(prev => prev.replace(/@\w*$/, "").trimEnd());
    textareaRef.current?.focus();
  }

  function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    onSend(text);
    setInput("");
    reset();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (showPicker) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const filtered = docs.filter(d =>
    d.name.toLowerCase().includes(docQuery.toLowerCase())
  );

  return (
    <div className="px-4 sm:px-6 pt-3 pb-5 shrink-0 bg-gradient-to-t from-background via-background to-transparent">
      <div className="max-w-3xl mx-auto space-y-2 relative">
        {/* Doc picker dropdown — floats above input */}
        {showPicker && (
          <div ref={pickerRef} className="absolute bottom-full left-0 right-0 mb-2 bg-popover border border-border rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden animate-scale z-10">
            <div className="px-3 py-2 border-b border-border flex items-center gap-2">
              <AtSign size={12} className="text-primary shrink-0" />
              <span className="text-xs text-muted-foreground">
                {docQuery ? `Searching "${docQuery}"` : "Your documents"}
              </span>
            </div>
            <div className="max-h-52 overflow-y-auto py-1 overscroll-contain">
              {!docsLoaded ? (
                <div className="flex items-center gap-2 px-3 py-3">
                  <Loader2 size={12} className="text-muted-foreground animate-spin" />
                  <span className="text-xs text-muted-foreground">Loading…</span>
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground px-3 py-3 text-center">No matching documents</p>
              ) : (
                filtered.map(doc => (
                  <button
                    key={doc.id}
                    onMouseDown={() => selectDoc(doc)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-accent transition-colors text-left"
                  >
                    <FileText size={13} className="text-muted-foreground shrink-0" />
                    <span className="text-xs text-popover-foreground truncate">{doc.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Composer card */}
        <div className="bg-card border border-border rounded-3xl shadow-xl shadow-black/5 dark:shadow-black/30 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all">
          {/* Attached doc chip — inside composer */}
          {attachedDoc && (
            <div className="flex items-center gap-2 px-3 pt-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs">
                <FileText size={12} />
                <span className="max-w-[220px] truncate font-medium">{attachedDoc.name}</span>
                <button onClick={() => onAttach(null)} className="ml-0.5 hover:opacity-70 transition-opacity">
                  <X size={12} />
                </button>
              </div>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => { setInput(e.target.value); adjust(); }}
            onKeyDown={onKeyDown}
            placeholder="Message… type @ to attach a document"
            rows={1}
            disabled={sending}
            className="w-full bg-transparent resize-none px-5 pt-4 pb-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none disabled:opacity-50 max-h-48"
          />

          <div className="flex items-center justify-between px-3 pb-3 pt-1">
            <p className="text-[11px] text-muted-foreground pl-2 hidden sm:block">
              <kbd className="px-1 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">↵</kbd> send ·{" "}
              <kbd className="px-1 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">⇧↵</kbd> new line
            </p>
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-primary hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-600/30 hover:shadow-violet-600/50 ml-auto"
              aria-label="Send"
            >
              {sending
                ? <Loader2 size={15} className="animate-spin text-white" />
                : <Send size={15} className="text-white" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
