import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { FileText, MessageSquare, Zap, Shield, ArrowRight, BookOpen } from "lucide-react";
import LandingAuthButtons from "@/components/LandingAuthButtons";

const features = [
  {
    icon: FileText,
    title: "Any format",
    desc: "PDF, DOCX, Markdown, plain text — upload whatever you study from.",
  },
  {
    icon: Zap,
    title: "Instant embeddings",
    desc: "Documents are chunked and embedded automatically. Ready to query in seconds.",
  },
  {
    icon: MessageSquare,
    title: "Streaming chat",
    desc: "Ask questions and get answers streamed in real-time with source context.",
  },
  {
    icon: Shield,
    title: "Private by default",
    desc: "Your documents are tied to your account. Nobody else can access them.",
  },
];

export default async function Home() {
  const { userId } = await auth();

  return (
    <main className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-6">
          <BookOpen size={12} />
          AI-powered study assistant
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground max-w-2xl leading-[1.1] mb-5">
          Chat with your{" "}
          <span className="bg-gradient-to-r from-violet-500 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
            study materials
          </span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-md mb-10 leading-relaxed">
          Upload your PDFs, notes, and textbooks. Ask questions, get
          explanations, and actually understand what you&apos;re studying.
        </p>

        <div className="flex items-center gap-3 flex-wrap justify-center">
          {userId ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-primary hover:opacity-90 text-primary-foreground px-6 py-2.5 rounded-xl font-medium transition-all text-sm shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40"
            >
              Go to Dashboard <ArrowRight size={16} />
            </Link>
          ) : (
            <LandingAuthButtons />
          )}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 pb-24 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="p-5 rounded-2xl border border-border bg-card hover:border-muted-foreground/30 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
                <Icon size={16} className="text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
