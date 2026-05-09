import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PlacementIQ — IIT Kharagpur Placement Hub',
  description: 'Track, filter and prepare for 500+ placement roles at IIT Kharagpur. Powered by real data.',
  keywords: ['IIT KGP', 'placements', 'jobs', 'internship', 'CTC', 'dashboard'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-[#0a0f1e] text-slate-100 antialiased`}>
        {children}
      </body>
    </html>
  )
}
