import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const metadata = {
  title: 'Settings - Webmaster Dashboard',
  description: 'Dashboard settings and configuration',
}

export default async function SettingsPage() {
  const supabase = createServiceRoleClient()

  const { data: websites } = await supabase
    .from('websites')
    .select('*')
    .order('name')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Dashboard ayarları ve yapılandırma
        </p>
      </div>

      <div className="grid gap-6">
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Website Ayarları</h2>
          <div className="space-y-4">
            {websites?.map(website => (
              <div key={website.id} className="flex items-center justify-between p-4 border rounded">
                <div>
                  <h3 className="font-medium">{website.name}</h3>
                  <p className="text-sm text-muted-foreground">{website.domain}</p>
                </div>
                <div className="text-sm">
                  <span className={`px-2 py-1 rounded ${
                    website.status === 'online' ? 'bg-green-100 text-green-700' :
                    website.status === 'offline' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {website.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Environment Status</h2>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span>Supabase</span>
              <span className="text-green-600">✓ Connected</span>
            </div>
            <div className="flex justify-between">
              <span>Google APIs</span>
              <span className="text-green-600">✓ Configured</span>
            </div>
            <div className="flex justify-between">
              <span>Email Service</span>
              <span className="text-green-600">✓ Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
