import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { ManualActionsGrid } from '@/components/actions/manual-actions-grid'

export const metadata = {
  title: 'Manual Actions - Webmaster Dashboard',
  description: 'Manually trigger checks and diagnostics',
}

export default async function ActionsPage() {
  const supabase = createServiceRoleClient()

  const { data: websites } = await supabase
    .from('websites')
    .select('*')
    .order('name')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manual Actions</h1>
        <p className="text-muted-foreground mt-2">
          Anlık testler ve manuel kontroller
        </p>
      </div>

      <ManualActionsGrid websites={websites || []} />
    </div>
  )
}
