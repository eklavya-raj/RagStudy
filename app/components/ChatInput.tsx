"use client";
import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { useAutoResize } from "@/app/lib/hooks/useAutoResize";

interface Props {
  onSend: (text: string) => void;
  sending: boolean;
  placeholder?: string;
  hint?: string;
  children?: React.ReactNode;
}

export default function ChatInput({ onSend, sending, placeholder = "Type a message…", hint, children }: Props) {
  const [input, setInput] = useState("");
  const { ref, adjust, reset } = useAutoResize();

  function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    onSend(text);
    setInput("");
    reset();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="px-4 sm:px-6 pt-3 pb-5 shrink-0 bg-gradient-to-t from-background via-background to-transparent">
      <div className="max-w-3xl mx-auto space-y-2">
        {children}
        <div className="bg-card border border-border rounded-3xl shadow-xl shadow-black/5 dark:shadow-black/30 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all">
          <textarea
            ref={ref}
            value={input}
            onChange={e => { setInput(e.target.value); adjust(); }}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={sending}
            className="w-full bg-transparent resize-none px-5 pt-4 pb-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none disabled:opacity-50 max-h-48"
          />
          <div className="flex items-center justify-between px-3 pb-3 pt-1">
            <p className="text-[11px] text-muted-foreground pl-2 hidden sm:block">
              {hint ?? (
                <>
                  <kbd className="px-1 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">↵</kbd> send ·{" "}
                  <kbd className="px-1 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">⇧↵</kbd> new line
                </>
              )}
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

export function useInputRef() {
  return useAutoResize();
}
