import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ARWay Lite Admin',
  description: 'ARWay Lite 관리자 대시보드',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}

