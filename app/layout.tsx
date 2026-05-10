import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { Geist, Geist_Mono } from 'next/font/google'
import Link from 'next/link'
import './globals.css'
import 'katex/dist/katex.min.css'
import { ThemeProvider } from './components/ThemeProvider'
import HeaderAuthControls from './components/HeaderAuthControls'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'RAGStudy — Chat with your documents',
  description: 'Upload study materials and chat with them using AI',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { userId } = await auth()
  const isSignedIn = Boolean(userId)

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground`}>
        <ThemeProvider>
          <ClerkProvider>
            <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                <div className="flex items-center gap-7">
                  <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-600/20 group-hover:shadow-violet-600/40 transition-shadow">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 3h10M2 7h7M2 11h5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <span className="font-semibold text-foreground tracking-tight text-[15px]">RAGStudy</span>
                  </Link>
                  {isSignedIn && (
                    <nav className="hidden sm:flex items-center gap-0.5">
                      <Link href="/dashboard" className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all font-medium">
                        Documents
                      </Link>
                      <Link href="/chat" className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all font-medium">
                        Chat
                      </Link>
                    </nav>
                  )}
                </div>
                <HeaderAuthControls isSignedIn={isSignedIn} />
              </div>
            </header>
            {children}
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
