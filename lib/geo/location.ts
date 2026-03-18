export interface GeoLocation {
  country: string | null
  city: string | null
  region: string | null
  latitude: number | null
  longitude: number | null
  timezone: string | null
}

/**
 * Get geographic location from IP address
 * Uses geoip-lite for fast, free IP geolocation
 *
 * @param ip - IPv4 or IPv6 address
 * @returns Geographic location data
 */
export function getGeoLocation(ip: string): GeoLocation {
  // Handle localhost and private IPs
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return {
      country: 'LOCAL',
      city: 'localhost',
      region: null,
      latitude: null,
      longitude: null,
      timezone: null
    }
  }

  try {
    // Dynamically import geoip-lite (runtime only)
    const geoip = require('geoip-lite')

    // Clean IP (remove IPv6 prefix if present)
    const cleanIp = ip.replace(/^::ffff:/, '')

    const geo = geoip.lookup(cleanIp)

    if (!geo) {
      return {
        country: null,
        city: null,
        region: null,
        latitude: null,
        longitude: null,
        timezone: null
      }
    }

    return {
      country: geo.country || null,
      city: null, // geoip-lite doesn't provide city
      region: geo.region || null,
      latitude: geo.ll ? geo.ll[0] : null,
      longitude: geo.ll ? geo.ll[1] : null,
      timezone: geo.timezone || null
    }
  } catch (error) {
    console.warn('GeoIP lookup failed:', error)
    return {
      country: null,
      city: null,
      region: null,
      latitude: null,
      longitude: null,
      timezone: null
    }
  }
}

/**
 * Extract IP address from Next.js request headers
 * Handles various proxy headers (Vercel, Cloudflare, etc.)
 *
 * @param headers - Request headers
 * @returns IP address or null
 */
export function getIpFromHeaders(headers: Headers): string | null {
  // Try various headers in order of preference
  const possibleHeaders = [
    'x-real-ip',
    'x-forwarded-for',
    'cf-connecting-ip', // Cloudflare
    'fastly-client-ip', // Fastly
    'x-client-ip',
    'x-cluster-client-ip',
    'x-forwarded',
    'forwarded-for',
    'forwarded',
  ]

  for (const header of possibleHeaders) {
    const value = headers.get(header)
    if (value) {
      // x-forwarded-for can be comma-separated list, take first IP
      const ip = value.split(',')[0].trim()
      if (ip) return ip
    }
  }

  return null
}
