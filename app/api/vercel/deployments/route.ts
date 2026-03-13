import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDeployments, getProject } from '@/lib/vercel/api'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const websiteId = searchParams.get('websiteId')

  if (!websiteId) {
    return NextResponse.json(
      { error: 'websiteId is required' },
      { status: 400 }
    )
  }

  try {
    // Get website with Vercel project ID
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select('vercel_project_id, name')
      .eq('id', websiteId)
      .single()

    if (websiteError || !website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      )
    }

    if (!website.vercel_project_id) {
      return NextResponse.json({
        deployments: [],
        message: 'No Vercel project ID configured for this website'
      })
    }

    // Fetch deployments from Vercel
    const deployments = await getDeployments(website.vercel_project_id, 20)

    // Store deployments in database
    for (const deployment of deployments.slice(0, 10)) {
      await supabase.from('vercel_deployments').upsert({
        website_id: websiteId,
        deployment_id: deployment.uid,
        deployment_url: deployment.url,
        status: deployment.state,
        created_at: new Date(deployment.created).toISOString(),
        metadata: {
          target: deployment.target,
          creator: deployment.creator?.username,
          commit_message: deployment.meta?.githubCommitMessage,
          commit_ref: deployment.meta?.githubCommitRef,
          commit_sha: deployment.meta?.githubCommitSha
        }
      }, {
        onConflict: 'deployment_id'
      })
    }

    return NextResponse.json({ deployments })
  } catch (error: any) {
    console.error('Failed to fetch Vercel deployments:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch deployments' },
      { status: 500 }
    )
  }
}
