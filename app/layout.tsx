import type React from "react"
// ⬇️ must be first – installs the safe-fetch polyfill
import "@/lib/preview-safe-fetch"

import type { Metadata, Viewport } from "next"
import { Quicksand } from 'next/font/google'
import "./globals.css"

const quicksand = Quicksand({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-quicksand',
})

export const metadata: Metadata = {
  title: "AI-Powered College Search | Find Your Perfect University Match Worldwide | Coaching for College",
  description: "Discover your ideal college from 10,000+ verified colleges across 50+ countries with AI-powered self-discovery and matching. We understand diverse global high school systems including IB, A-levels, US GPA, and more. Unlike US-centric platforms, our global tool guides you to understand your preferences. ICA certified coaches with 100% admission rate. Free with usage limits.",
  keywords: "AI college search, AI university finder, college matching AI, IB diploma college matching, A-levels university admissions, international curriculum college search, study abroad, global universities, college admissions platform, ICA certified coach, AI self-discovery, scholarship finder, application tracker, international education, AI college counseling, machine learning college match",
  authors: [{ name: "Coaching for College" }],
  creator: "Coaching for College",
  publisher: "Coaching for College",
  generator: "v0.dev",
  metadataBase: new URL("https://coachingforcollegeapp.xyz"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://coachingforcollegeapp.xyz/",
    siteName: "Coaching for College - AI-Powered College Search Platform",
    title: "AI-Powered College Matching with Self-Discovery | Coaching for College",
    description: "Unlike US-centric platforms, our AI guides you through self-discovery to find your perfect match from 10,000+ global colleges. We understand IB, A-levels, GPA, and diverse high school systems. ICA certified coaches with 100% admission rate.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Coaching for College - Global University Search Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI-Powered College Matching with Self-Discovery",
    description: "Our AI guides you to discover what you want in a college across 10,000+ global colleges. ICA certified coaches with 100% admission rate.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={quicksand.variable}>
      <head>
        {/* CSP temporarily disabled for AI development */}
      </head>
      <body className={quicksand.className}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Global error handler for chunk loading errors
              window.addEventListener('error', function(event) {
                if (event.message && (event.message.includes('Loading chunk') || event.message.includes('ChunkLoadError'))) {
                  console.warn('Chunk loading error detected, reloading page...');
                  window.location.reload();
                }
              });
              
              // Handle unhandled promise rejections that might be chunk errors
              window.addEventListener('unhandledrejection', function(event) {
                if (event.reason && event.reason.message && 
                    (event.reason.message.includes('Loading chunk') || event.reason.message.includes('ChunkLoadError'))) {
                  console.warn('Chunk loading promise rejection detected, reloading page...');
                  event.preventDefault();
                  window.location.reload();
                }
              });
            `,
          }}
        />
        {children}
      </body>
    </html>
  )
}
