"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import type { ChatMessage } from "../types";

interface UseChatOptions {
  documentId?: string;
  model: string;
}

export function useChat({ documentId, model }: UseChatOptions) {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const base = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || sending) return;
    setError(null);

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const updatedHistory = [...messages, userMsg];
    setMessages([...updatedHistory, { role: "assistant", content: "", streaming: true }]);
    setSending(true);

    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`${base}/api/chat`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedHistory.map(({ role, content }) => ({ role, content })),
          model,
          documentId,
        }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const raw = decoder.decode(value, { stream: true });
        for (const line of raw.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") break;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.delta) {
              assistantText += parsed.delta;
              setMessages([...updatedHistory, { role: "assistant", content: assistantText, streaming: true }]);
            }
          } catch {}
        }
      }
      setMessages([...updatedHistory, { role: "assistant", content: assistantText, streaming: false }]);
    } catch (e: unknown) {
      setMessages(updatedHistory);
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }, [messages, sending, getToken, base, model, documentId]);

  return { messages, sending, error, bottomRef, sendMessage };
}
