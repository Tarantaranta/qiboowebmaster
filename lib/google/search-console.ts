import { google } from 'googleapis'

export interface SearchConsoleQueryResult {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface SearchConsolePageResult {
  page: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface SearchConsoleDimension {
  dimension: 'query' | 'page' | 'country' | 'device' | 'date'
  value: string
}

export interface SearchConsoleRow {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

/**
 * Initialize Google Search Console API client
 */
function getSearchConsoleClient() {
  try {
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON

    if (!credentialsJson) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON not configured')
    }

    const credentials = JSON.parse(credentialsJson)

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    })

    return google.searchconsole({ version: 'v1', auth })
  } catch (error: any) {
    console.error('Failed to initialize Search Console client:', error.message)
    throw error
  }
}

/**
 * Fetch search queries from Google Search Console
 * @param siteUrl - Full site URL (e.g., https://example.com or sc-domain:example.com)
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @param dimensions - Dimensions to group by (default: ['query'])
 * @param rowLimit - Max rows to return (default: 1000, max: 25000)
 */
export async function fetchSearchQueries(
  siteUrl: string,
  startDate: string,
  endDate: string,
  dimensions: string[] = ['query'],
  rowLimit: number = 1000
): Promise<SearchConsoleRow[]> {
  const searchconsole = getSearchConsoleClient()

  try {
    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions,
        rowLimit,
        dimensionFilterGroups: [],
      },
    })

    const rows = response.data.rows || []
    return rows.map(row => ({
      keys: row.keys || [],
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    }))
  } catch (error: any) {
    console.error('Search Console API error:', error.message)

    // Return empty array if no data (not an error)
    if (error.message?.includes('No data available')) {
      return []
    }

    throw new Error(`Failed to fetch search queries: ${error.message}`)
  }
}

/**
 * Fetch page performance from Google Search Console
 */
export async function fetchSearchPages(
  siteUrl: string,
  startDate: string,
  endDate: string,
  rowLimit: number = 1000
): Promise<SearchConsoleRow[]> {
  return fetchSearchQueries(siteUrl, startDate, endDate, ['page'], rowLimit)
}

/**
 * Fetch queries with country and device breakdown
 */
export async function fetchSearchQueriesDetailed(
  siteUrl: string,
  startDate: string,
  endDate: string,
  rowLimit: number = 5000
): Promise<SearchConsoleRow[]> {
  return fetchSearchQueries(
    siteUrl,
    startDate,
    endDate,
    ['query', 'country', 'device'],
    rowLimit
  )
}

/**
 * Fetch pages with country and device breakdown
 */
export async function fetchSearchPagesDetailed(
  siteUrl: string,
  startDate: string,
  endDate: string,
  rowLimit: number = 5000
): Promise<SearchConsoleRow[]> {
  return fetchSearchQueries(
    siteUrl,
    startDate,
    endDate,
    ['page', 'country', 'device'],
    rowLimit
  )
}

/**
 * Verify site ownership in Google Search Console
 */
export async function verifySiteAccess(siteUrl: string): Promise<boolean> {
  const searchconsole = getSearchConsoleClient()

  try {
    await searchconsole.sites.get({ siteUrl })
    return true
  } catch (error: any) {
    console.error('Site verification failed:', error.message)
    return false
  }
}

/**
 * List all sites in Search Console account
 */
export async function listSearchConsoleSites(): Promise<string[]> {
  const searchconsole = getSearchConsoleClient()

  try {
    const response = await searchconsole.sites.list()
    return response.data.siteEntry?.map(site => site.siteUrl || '') || []
  } catch (error: any) {
    console.error('Failed to list sites:', error.message)
    return []
  }
}

/**
 * Format domain for Search Console API
 * Converts "example.com" to "https://example.com" or "sc-domain:example.com"
 */
export function formatSiteUrl(domain: string, useDomainProperty: boolean = false): string {
  // Remove any existing protocol
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '')

  if (useDomainProperty) {
    // Domain property (all subdomains, http and https)
    return `sc-domain:${cleanDomain}`
  } else {
    // URL-prefix property (specific protocol)
    return `https://${cleanDomain}`
  }
}

/**
 * Get top queries for a site
 */
export async function getTopQueries(
  siteUrl: string,
  days: number = 7,
  limit: number = 100
): Promise<SearchConsoleQueryResult[]> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const rows = await fetchSearchQueries(
    siteUrl,
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0],
    ['query'],
    limit
  )

  return rows.map(row => ({
    query: row.keys[0],
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  }))
}

/**
 * Get top pages for a site
 */
export async function getTopPages(
  siteUrl: string,
  days: number = 7,
  limit: number = 100
): Promise<SearchConsolePageResult[]> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const rows = await fetchSearchPages(
    siteUrl,
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0],
    limit
  )

  return rows.map(row => ({
    page: row.keys[0],
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  }))
}
