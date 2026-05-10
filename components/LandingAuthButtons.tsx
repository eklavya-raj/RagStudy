"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";

export default function LandingAuthButtons() {
  return (
    <>
      <SignUpButton>
        <button className="inline-flex items-center gap-2 bg-primary hover:opacity-90 text-primary-foreground px-6 py-2.5 rounded-xl font-medium transition-all text-sm cursor-pointer shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40">
          Get started free <ArrowRight size={16} />
        </button>
      </SignUpButton>
      <SignInButton>
        <button className="text-sm text-muted-foreground hover:text-foreground px-4 py-2.5 transition-colors cursor-pointer">
          Sign in
        </button>
      </SignInButton>
    </>
  );
}
