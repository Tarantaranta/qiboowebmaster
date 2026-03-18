import { RealtimeDashboard } from '@/components/analytics/realtime-dashboard'

export const dynamic = 'force-dynamic'

export default function RealtimePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Real-time Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Live visitor activity across all websites
        </p>
      </div>
      <RealtimeDashboard />
    </div>
  )
}
