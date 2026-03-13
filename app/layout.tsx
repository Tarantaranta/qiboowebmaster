import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Webmaster Dashboard - SEO & Analytics Platform",
  description: "Manage all your websites, SEO analytics, and monitoring in one place",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
