import https from 'https'

export interface SSLCertificateInfo {
  domain: string
  issuer: string
  validFrom: string
  validTo: string
  daysUntilExpiry: number
  isValid: boolean
  error?: string
}

/**
 * Check SSL certificate for a domain
 * @param domain - Domain name (without https://)
 * @returns SSL certificate information
 */
export async function checkSSLCertificate(domain: string): Promise<SSLCertificateInfo> {
  return new Promise((resolve) => {
    const options = {
      host: domain,
      port: 443,
      method: 'GET',
      rejectUnauthorized: false // Allow checking even invalid certs
    }

    const req = https.request(options, (res) => {
      const socket = res.socket as any
      const cert = socket.getPeerCertificate()

      if (!cert || Object.keys(cert).length === 0) {
        resolve({
          domain,
          issuer: 'Unknown',
          validFrom: '',
          validTo: '',
          daysUntilExpiry: 0,
          isValid: false,
          error: 'No certificate found'
        })
        return
      }

      const validTo = new Date(cert.valid_to)
      const now = new Date()
      const daysUntilExpiry = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const isValid = daysUntilExpiry > 0 && socket.authorized

      resolve({
        domain,
        issuer: cert.issuer?.O || cert.issuer?.CN || 'Unknown',
        validFrom: cert.valid_from,
        validTo: cert.valid_to,
        daysUntilExpiry,
        isValid
      })

      socket.end()
    })

    req.on('error', (error) => {
      resolve({
        domain,
        issuer: 'Unknown',
        validFrom: '',
        validTo: '',
        daysUntilExpiry: 0,
        isValid: false,
        error: error.message
      })
    })

    req.setTimeout(5000, () => {
      req.destroy()
      resolve({
        domain,
        issuer: 'Unknown',
        validFrom: '',
        validTo: '',
        daysUntilExpiry: 0,
        isValid: false,
        error: 'Timeout'
      })
    })

    req.end()
  })
}

/**
 * Get SSL certificate status/color based on days until expiry
 */
export function getSSLStatus(daysUntilExpiry: number): {
  status: 'valid' | 'warning' | 'critical' | 'expired'
  color: string
  message: string
} {
  if (daysUntilExpiry <= 0) {
    return {
      status: 'expired',
      color: 'text-red-600',
      message: 'Expired'
    }
  } else if (daysUntilExpiry <= 7) {
    return {
      status: 'critical',
      color: 'text-red-600',
      message: `Expires in ${daysUntilExpiry} days!`
    }
  } else if (daysUntilExpiry <= 30) {
    return {
      status: 'warning',
      color: 'text-yellow-600',
      message: `Expires in ${daysUntilExpiry} days`
    }
  } else {
    return {
      status: 'valid',
      color: 'text-green-600',
      message: `Valid for ${daysUntilExpiry} days`
    }
  }
}
