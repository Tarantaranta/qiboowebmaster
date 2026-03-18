import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Activity, BarChart3, MessageSquare, Settings, AlertTriangle, Globe, LogOut, Eye, Zap, Shield, GitBranch, Radio, Search, Target, FileText, PlayCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white/80 backdrop-blur-xl dark:bg-gray-900/80">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="border-b px-6 py-5">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="rounded-lg bg-primary p-2">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Webmaster</h1>
                <p className="text-xs text-muted-foreground">Dashboard</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            <NavLink href="/dashboard" icon={<Globe />} label="Genel Bakış" />
            <NavLink href="/dashboard/monitoring" icon={<Eye />} label="Canlı Monitoring" />
            <NavLink href="/dashboard/analytics" icon={<BarChart3 />} label="Analytics" />
            <NavLink href="/dashboard/performance" icon={<Zap />} label="Performance" />
            <NavLink href="/dashboard/uptime" icon={<Activity />} label="Uptime" />
            <NavLink href="/dashboard/ssl" icon={<Shield />} label="SSL Certificates" />
            <NavLink href="/dashboard/funnels" icon={<GitBranch />} label="User Flows" />
            <NavLink href="/dashboard/realtime" icon={<Radio />} label="Real-time" />
            <NavLink href="/dashboard/seo" icon={<Search />} label="SEO Dashboard" />
            <NavLink href="/dashboard/keywords" icon={<Target />} label="Keywords" />
            <NavLink href="/dashboard/reports" icon={<FileText />} label="Reports" />
            <NavLink href="/dashboard/actions" icon={<PlayCircle />} label="Manual Actions" />
            <NavLink href="/dashboard/errors" icon={<AlertTriangle />} label="Hatalar" />
            <NavLink href="/dashboard/chatbot" icon={<MessageSquare />} label="Chatbot" />
            <NavLink href="/dashboard/settings" icon={<Settings />} label="Ayarlar" />
          </nav>

          {/* User section */}
          <div className="border-t p-4">
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {user.email?.[0].toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate font-medium">{user.email}</p>
              </div>
              <form action="/api/auth/logout" method="post">
                <Button variant="ghost" size="icon" className="h-8 w-8" type="submit">
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="pl-64">
        <div className="container mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <span className="h-5 w-5">{icon}</span>
      {label}
    </Link>
  )
}
