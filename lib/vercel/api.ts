/**
 * Vercel API Integration
 *
 * Setup:
 * 1. Go to https://vercel.com/account/tokens
 * 2. Click "Create Token"
 * 3. Give it a name (e.g., "Webmaster Dashboard")
 * 4. Select scope: "Full Access" or "Read-only" (read-only is safer)
 * 5. Copy token and add to .env.local: VERCEL_API_TOKEN=...
 *
 * Get Project IDs:
 * 1. Go to project settings on Vercel
 * 2. Copy the Project ID
 * 3. Add to websites table in database
 */

const VERCEL_API_BASE = 'https://api.vercel.com'

export interface VercelDeployment {
  uid: string
  name: string
  url: string
  created: number
  state: 'READY' | 'ERROR' | 'BUILDING' | 'QUEUED' | 'CANCELED'
  creator: {
    username: string
  }
  target: 'production' | 'preview'
  meta?: {
    githubCommitMessage?: string
    githubCommitRef?: string
    githubCommitSha?: string
  }
}

export interface VercelProject {
  id: string
  name: string
  accountId: string
  framework: string
  devCommand: string | null
  buildCommand: string | null
  outputDirectory: string | null
  latestDeployments: VercelDeployment[]
}

async function vercelFetch(endpoint: string) {
  const token = process.env.VERCEL_API_TOKEN

  if (!token) {
    throw new Error('VERCEL_API_TOKEN not configured')
  }

  const response = await fetch(`${VERCEL_API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Vercel API error: ${response.status} - ${error}`)
  }

  return response.json()
}

export async function getDeployments(
  projectId: string,
  limit = 10
): Promise<VercelDeployment[]> {
  try {
    const data = await vercelFetch(
      `/v6/deployments?projectId=${projectId}&limit=${limit}`
    )
    return data.deployments || []
  } catch (error) {
    console.error('Failed to fetch Vercel deployments:', error)
    return []
  }
}

export async function getProject(projectId: string): Promise<VercelProject | null> {
  try {
    const data = await vercelFetch(`/v9/projects/${projectId}`)
    return data
  } catch (error) {
    console.error('Failed to fetch Vercel project:', error)
    return null
  }
}

export async function getDeploymentLogs(deploymentId: string) {
  try {
    const data = await vercelFetch(`/v2/deployments/${deploymentId}/events`)
    return data
  } catch (error) {
    console.error('Failed to fetch deployment logs:', error)
    return null
  }
}

export async function listProjects(): Promise<VercelProject[]> {
  try {
    const data = await vercelFetch('/v9/projects')
    return data.projects || []
  } catch (error) {
    console.error('Failed to list Vercel projects:', error)
    return []
  }
}

export function formatDeploymentState(state: string): {
  label: string
  color: string
} {
  switch (state) {
    case 'READY':
      return { label: '✅ Ready', color: 'text-green-600' }
    case 'ERROR':
      return { label: '❌ Error', color: 'text-red-600' }
    case 'BUILDING':
      return { label: '🔨 Building', color: 'text-blue-600' }
    case 'QUEUED':
      return { label: '⏳ Queued', color: 'text-yellow-600' }
    case 'CANCELED':
      return { label: '🚫 Canceled', color: 'text-gray-600' }
    default:
      return { label: state, color: 'text-gray-600' }
  }
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  } else if (diffMins > 0) {
    return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
  } else {
    return 'Just now'
  }
}
