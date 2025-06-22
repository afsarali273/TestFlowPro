import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TestFlow Pro',
  description: 'This is API Automation Tool',
  generator: 'Afsar',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
