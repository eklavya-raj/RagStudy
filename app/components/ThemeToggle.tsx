"use client";
import { useState, useRef, useEffect } from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, resolved, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const Icon = resolved === "dark" ? Moon : Sun;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Toggle theme"
        className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <Icon size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-36 bg-popover border border-border rounded-xl shadow-xl shadow-black/10 dark:shadow-black/40 z-50 overflow-hidden animate-scale origin-top-right">
          {([
            ["light", "Light", Sun],
            ["dark", "Dark", Moon],
            ["system", "System", Monitor],
          ] as const).map(([val, label, I]) => (
            <button
              key={val}
              onClick={() => { setTheme(val); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors ${
                theme === val
                  ? "text-primary bg-primary/10"
                  : "text-popover-foreground hover:bg-accent"
              }`}
            >
              <I size={13} />
              <span className="flex-1">{label}</span>
              {theme === val && <Check size={12} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
