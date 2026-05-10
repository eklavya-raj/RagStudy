"use client";

import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";
import ThemeToggle from "./ThemeToggle";

type HeaderAuthControlsProps = {
  isSignedIn: boolean;
};

export default function HeaderAuthControls({ isSignedIn }: HeaderAuthControlsProps) {
  const { isLoaded } = useAuth();

  return (
    <div className="flex items-center gap-2">
      <ThemeToggle />
      {isSignedIn ? (
        <div className="w-9 h-9 flex items-center justify-center shrink-0">
          {isLoaded ? (
            <UserButton
              appearance={{
                elements: {
                  userButtonTrigger: "w-9 h-9",
                  userButtonAvatarBox: "w-8 h-8",
                },
              }}
            />
          ) : (
            <div
              aria-hidden="true"
              className="w-8 h-8 rounded-full bg-muted border border-border"
            />
          )}
        </div>
      ) : (
        <>
          <SignInButton>
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer font-medium px-3 py-1.5">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton>
            <button className="text-sm bg-primary hover:opacity-90 text-primary-foreground px-4 py-1.5 rounded-lg transition-all cursor-pointer font-medium shadow-lg shadow-violet-600/20">
              Get started
            </button>
          </SignUpButton>
        </>
      )}
    </div>
  );
}
