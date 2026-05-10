"use client";
import { Bot, User } from "lucide-react";
import MarkdownContent from "./MarkdownContent";
import type { ChatMessage } from "@/lib/types";

interface Props {
  message: ChatMessage;
}

function TypingIndicator() {
  return (
    <span className="inline-flex gap-1 items-center text-muted-foreground py-1">
      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
    </span>
  );
}

function StreamCursor() {
  return <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse align-middle" />;
}

export default function ChatBubble({ message: msg }: Props) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${
        isUser
          ? "bg-gradient-to-br from-violet-500 to-violet-700"
          : "bg-card border border-border"
      }`}>
        {isUser
          ? <User size={14} className="text-white" />
          : <Bot size={14} className="text-muted-foreground" />}
      </div>

      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? "bg-gradient-to-br from-violet-600 to-violet-700 text-white rounded-tr-md shadow-lg shadow-violet-600/20"
          : "bg-card border border-border text-foreground rounded-tl-md"
      }`}>
        {isUser ? (
          <span className="whitespace-pre-wrap">{msg.content}</span>
        ) : (
          <>
            {msg.content ? (
              <MarkdownContent content={msg.content} />
            ) : msg.streaming ? (
              <TypingIndicator />
            ) : null}
            {msg.streaming && msg.content && <StreamCursor />}
          </>
        )}
      </div>
    </div>
  );
}
