import type React from "react"
// ⬇️ must be first – installs the safe-fetch polyfill
import "@/lib/preview-safe-fetch"

import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "College Search Platform",
  description: "Find and match with the perfect colleges for your future",
  generator: "v0.dev",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        {/* CSP temporarily disabled for AI development */}
      </head>
      <body>
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
