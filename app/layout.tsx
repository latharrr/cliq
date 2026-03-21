import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'react-hot-toast'
export const metadata: Metadata = {
  title: 'Cliq — Your Campus Social Network',
  description: 'The hyperlocal social network for your college campus. Connect, share, and vibe with verified students only.',
  keywords: ['college', 'campus', 'social network', 'students'],
  openGraph: {
    title: 'Cliq — Your Campus Social Network',
    description: 'Hyperlocal college social app for verified students.',
    type: 'website',
  },
}

import type { Viewport } from 'next'

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'rgba(15,15,25,0.9)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#f1f5f9',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
