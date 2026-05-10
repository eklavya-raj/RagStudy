"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { MODELS, isFreeModel } from "@/lib/models";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placement?: "top" | "bottom";
  align?: "left" | "right";
}

export default function ModelSelector({ value, onChange, placement = "bottom", align = "right" }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const current = MODELS.find(m => m.value === value) ?? MODELS[0];
  const filtered = MODELS.filter(m =>
    m.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => { setOpen(v => !v); setQuery(""); }}
        className="flex items-center gap-1.5 text-xs bg-card border border-border hover:border-muted-foreground/30 text-foreground rounded-lg px-3 py-1.5 transition-all hover:bg-accent max-w-[200px]"
      >
        <span className="truncate">{current.label}</span>
        {isFreeModel(current.value) && <FreeBadge />}
        <ChevronDown size={12} className={`shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className={`absolute w-[min(18rem,calc(100vw-2rem))] bg-popover border border-border rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/40 z-50 overflow-hidden animate-scale ${
            align === "left" ? "left-0" : "right-0"
          } ${
            placement === "top"
              ? align === "left"
                ? "bottom-full mb-2 origin-bottom-left"
                : "bottom-full mb-2 origin-bottom-right"
              : align === "left"
                ? "top-full mt-2 origin-top-left"
                : "top-full mt-2 origin-top-right"
          }`}
        >
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 bg-muted rounded-lg px-2.5 py-2">
              <Search size={13} className="text-muted-foreground shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search models…"
                className="bg-transparent text-xs text-foreground placeholder-muted-foreground outline-none w-full"
              />
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto py-1 overscroll-contain">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground px-3 py-3 text-center">No models found</p>
            ) : (
              filtered.map(m => {
                const selected = m.value === value;
                return (
                  <button
                    key={m.value}
                    onClick={() => { onChange(m.value); setOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs transition-colors text-left ${
                      selected
                        ? "bg-primary/10 text-primary"
                        : "text-popover-foreground hover:bg-accent"
                    }`}
                  >
                    <span className="w-4 shrink-0">
                      {selected && <Check size={12} />}
                    </span>
                    <span className="truncate flex-1">{m.label}</span>
                    {isFreeModel(m.value) && <FreeBadge />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FreeBadge() {
  return (
    <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-success/10 text-success border border-success/20 leading-none">
      free
    </span>
  );
}
