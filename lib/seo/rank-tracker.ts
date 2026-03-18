/**
 * Keyword Rank Tracking using SerpApi
 * API Docs: https://serpapi.com/search-api
 */

export interface RankCheckResult {
  keyword: string
  domain: string
  position: number | null
  url: string | null
  found: boolean
  searchEngine: string
  location: string
  timestamp: Date
}

export interface SerpApiResult {
  position: number
  title: string
  link: string
  snippet?: string
}

/**
 * Check keyword ranking using SerpApi
 * @param keyword - Search keyword
 * @param domain - Domain to check (without protocol)
 * @param location - Location for search (e.g., "Turkey", "United States")
 * @param searchEngine - Search engine (default: google)
 */
export async function checkKeywordRank(
  keyword: string,
  domain: string,
  location: string = 'Turkey',
  searchEngine: string = 'google'
): Promise<RankCheckResult> {
  const apiKey = process.env.SERPAPI_API_KEY

  if (!apiKey) {
    console.warn('SERPAPI_API_KEY not configured, using mock data')
    return getMockRankResult(keyword, domain, location)
  }

  try {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '')

    // Build SerpApi query
    const params = new URLSearchParams({
      engine: searchEngine,
      q: keyword,
      api_key: apiKey,
      location: location,
      num: '100', // Check top 100 results
      gl: getCountryCode(location), // Country code
      hl: getLanguageCode(location), // Language code
    })

    const response = await fetch(`https://serpapi.com/search?${params.toString()}`)

    if (!response.ok) {
      throw new Error(`SerpApi error: ${response.statusText}`)
    }

    const data = await response.json()

    // Search for domain in organic results
    const organicResults: SerpApiResult[] = data.organic_results || []
    let position: number | null = null
    let url: string | null = null

    for (let i = 0; i < organicResults.length; i++) {
      const result = organicResults[i]
      const resultDomain = extractDomain(result.link)

      if (resultDomain === cleanDomain) {
        position = result.position || i + 1
        url = result.link
        break
      }
    }

    return {
      keyword,
      domain: cleanDomain,
      position,
      url,
      found: position !== null,
      searchEngine,
      location,
      timestamp: new Date(),
    }
  } catch (error: any) {
    console.error('Rank check error:', error.message)
    throw new Error(`Failed to check rank: ${error.message}`)
  }
}

/**
 * Check multiple keywords in batch
 */
export async function checkMultipleKeywordRanks(
  keywords: string[],
  domain: string,
  location: string = 'Turkey'
): Promise<RankCheckResult[]> {
  const results: RankCheckResult[] = []

  for (const keyword of keywords) {
    try {
      const result = await checkKeywordRank(keyword, domain, location)
      results.push(result)

      // Wait 1 second between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error: any) {
      console.error(`Failed to check rank for "${keyword}":`, error.message)
      results.push({
        keyword,
        domain,
        position: null,
        url: null,
        found: false,
        searchEngine: 'google',
        location,
        timestamp: new Date(),
      })
    }
  }

  return results
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/**
 * Get country code for SerpApi
 */
function getCountryCode(location: string): string {
  const countryMap: Record<string, string> = {
    'Turkey': 'tr',
    'United States': 'us',
    'United Kingdom': 'uk',
    'Germany': 'de',
    'France': 'fr',
    'Spain': 'es',
    'Italy': 'it',
    'Netherlands': 'nl',
    'Canada': 'ca',
    'Australia': 'au',
  }

  return countryMap[location] || 'tr'
}

/**
 * Get language code for SerpApi
 */
function getLanguageCode(location: string): string {
  const langMap: Record<string, string> = {
    'Turkey': 'tr',
    'United States': 'en',
    'United Kingdom': 'en',
    'Germany': 'de',
    'France': 'fr',
    'Spain': 'es',
    'Italy': 'it',
    'Netherlands': 'nl',
    'Canada': 'en',
    'Australia': 'en',
  }

  return langMap[location] || 'tr'
}

/**
 * Mock rank result for testing when API key is not configured
 */
function getMockRankResult(
  keyword: string,
  domain: string,
  location: string
): RankCheckResult {
  // Generate a random position between 1-100, or null if "not found"
  const random = Math.random()
  const position = random > 0.3 ? Math.floor(Math.random() * 50) + 1 : null

  return {
    keyword,
    domain,
    position,
    url: position ? `https://${domain}/page` : null,
    found: position !== null,
    searchEngine: 'google',
    location,
    timestamp: new Date(),
  }
}

/**
 * Calculate rank change
 */
export function calculateRankChange(
  currentPosition: number | null,
  previousPosition: number | null
): { change: number; direction: 'up' | 'down' | 'new' | 'lost' | 'same' } {
  if (currentPosition === null && previousPosition === null) {
    return { change: 0, direction: 'same' }
  }

  if (currentPosition !== null && previousPosition === null) {
    return { change: 0, direction: 'new' }
  }

  if (currentPosition === null && previousPosition !== null) {
    return { change: 0, direction: 'lost' }
  }

  const change = previousPosition! - currentPosition! // Lower position = better rank

  if (change > 0) {
    return { change, direction: 'up' }
  } else if (change < 0) {
    return { change: Math.abs(change), direction: 'down' }
  } else {
    return { change: 0, direction: 'same' }
  }
}
