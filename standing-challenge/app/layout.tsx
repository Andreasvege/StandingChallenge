import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google'
import './globals.css'

const display = Bricolage_Grotesque({ subsets: ['latin'], display: 'swap', variable: '--font-display' })
const body = DM_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' })

export const metadata: Metadata = {
  title: 'Stå på!',
  description: 'Hvem står mest ved ståpulten på The Brave-kontoret?',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nb" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  )
}
