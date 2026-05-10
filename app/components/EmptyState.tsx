"use client";
import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, children }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-3 pb-10 px-4">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
        <Icon size={24} className="text-primary" />
      </div>
      <h2 className="text-foreground font-semibold text-base">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">{description}</p>
      {children}
    </div>
  );
}
