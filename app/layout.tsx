import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '',
  description: '用AI为你生成永不重复的互动故事',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}

