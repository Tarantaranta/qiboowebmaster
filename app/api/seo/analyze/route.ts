import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { analyzeSEO } from '@/lib/openai'

export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const { website_id, url, mode = 'quick' } = await request.json()

    if (!website_id || !url) {
      return NextResponse.json(
        { error: 'website_id and url are required' },
        { status: 400 }
      )
    }

    // Fetch webpage content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WebmasterBot/1.0; +https://webmaster-seo.com/bot)'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`)
    }

    const html = await response.text()

    // ENHANCED Technical SEO Extraction
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)
    const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)
    const robotsMatch = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i)

    // Open Graph tags
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)
    const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i)
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)

    // Schema.org / JSON-LD
    const schemaMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || []
    const hasSchema = schemaMatches.length > 0

    // Headings
    const h1Matches = html.match(/<h1[^>]*>([^<]+)<\/h1>/gi) || []
    const h2Matches = html.match(/<h2[^>]*>([^<]+)<\/h2>/gi) || []
    const h3Matches = html.match(/<h3[^>]*>([^<]+)<\/h3>/gi) || []

    // Images
    const imgMatches = html.match(/<img[^>]*>/gi) || []
    const imgsWithoutAlt = imgMatches.filter(img => !img.includes('alt=')).length
    const webpImages = imgMatches.filter(img => img.includes('.webp')).length

    // Links
    const internalLinks = (html.match(/<a[^>]*href=["'][^"']*["'][^>]*>/gi) || [])
      .filter(link => link.includes(url.replace('https://', '').replace('http://', '').split('/')[0]))
    const externalLinks = (html.match(/<a[^>]*href=["']https?:\/\/[^"']*["'][^>]*>/gi) || [])
      .filter(link => !link.includes(url.replace('https://', '').replace('http://', '').split('/')[0]))

    const title = titleMatch ? titleMatch[1].trim() : ''
    const description = metaDescMatch ? metaDescMatch[1].trim() : ''
    const canonical = canonicalMatch ? canonicalMatch[1] : null
    const robotsMeta = robotsMatch ? robotsMatch[1] : null
    const h1Tags = h1Matches.map(h1 => h1.replace(/<\/?h1[^>]*>/gi, '').trim())
    const h2Tags = h2Matches.map(h2 => h2.replace(/<\/?h2[^>]*>/gi, '').trim())

    // Text content extraction
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    // Get AI analysis with mode
    let aiAnalysis = ''
    try {
      aiAnalysis = await analyzeSEO(url, textContent, html, mode as 'quick' | 'deep')
    } catch (error) {
      console.error('AI analysis failed:', error)
      aiAnalysis = 'AI analizi yapılamadı. OpenAI API kontrol edilmelidir.'
    }

    // ENHANCED SEO Score Calculation
    let score = 100
    const issues = []
    const wordCount = textContent.split(/\s+/).length

    // Title checks
    if (!title) {
      score -= 15
      issues.push({ type: 'title', severity: 'critical', message: 'Title tag eksik!' })
    } else {
      if (title.length < 30) {
        score -= 10
        issues.push({ type: 'title', severity: 'high', message: `Title kısa: ${title.length}/30 karakter` })
      }
      if (title.length > 60) {
        score -= 5
        issues.push({ type: 'title', severity: 'medium', message: `Title uzun: ${title.length}/60 (kesilecek)` })
      }
    }

    // Meta description
    if (!description) {
      score -= 15
      issues.push({ type: 'meta', severity: 'critical', message: 'Meta description eksik!' })
    } else {
      if (description.length < 120) {
        score -= 7
        issues.push({ type: 'meta', severity: 'high', message: `Description kısa: ${description.length}/150 karakter` })
      }
    }

    // H1 checks
    if (h1Tags.length === 0) {
      score -= 12
      issues.push({ type: 'heading', severity: 'critical', message: 'H1 tag eksik!' })
    }
    if (h1Tags.length > 1) {
      score -= 8
      issues.push({ type: 'heading', severity: 'medium', message: `${h1Tags.length} adet H1 var (1 olmalı)` })
    }

    // Technical SEO
    if (!canonical) {
      score -= 5
      issues.push({ type: 'technical', severity: 'medium', message: 'Canonical URL eksik' })
    }
    if (!hasSchema) {
      score -= 8
      issues.push({ type: 'technical', severity: 'high', message: 'Schema.org structured data eksik' })
    }
    if (!ogTitleMatch || !ogDescMatch || !ogImageMatch) {
      score -= 6
      issues.push({ type: 'social', severity: 'medium', message: 'Open Graph tags eksik (sosyal medya)' })
    }

    // Images
    if (imgsWithoutAlt > 0) {
      score -= Math.min(imgsWithoutAlt * 2, 15)
      issues.push({ type: 'images', severity: 'high', message: `${imgsWithoutAlt}/${imgMatches.length} görsel alt eksik` })
    }
    if (webpImages === 0 && imgMatches.length > 0) {
      score -= 4
      issues.push({ type: 'performance', severity: 'low', message: 'WebP format kullanılmamış' })
    }

    // Content
    if (wordCount < 300) {
      score -= 10
      issues.push({ type: 'content', severity: 'high', message: `İçerik kısa: ${wordCount}/300 kelime` })
    }

    // Links
    if (internalLinks.length < 3) {
      score -= 5
      issues.push({ type: 'linking', severity: 'medium', message: 'İç linkler az (min 3-5)' })
    }

    // HTTPS
    if (!url.startsWith('https')) {
      score -= 20
      issues.push({ type: 'security', severity: 'critical', message: 'HTTPS kullanılmıyor!' })
    }

    score = Math.max(0, score)

    // Save to database with enhanced data
    const { data: audit, error } = await supabase
      .from('seo_audits')
      .insert({
        website_id,
        url,
        score,
        issues,
        ai_analysis: aiAnalysis,
        meta_title: title,
        meta_description: description,
        h1_tags: h1Tags,
        h2_tags: h2Tags.slice(0, 10),
        word_count: wordCount,
        internal_links_count: internalLinks.length,
        external_links_count: externalLinks.length,
        images_count: imgMatches.length,
        images_without_alt: imgsWithoutAlt,
        https_enabled: url.startsWith('https'),
        mobile_friendly: null
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ audit })
  } catch (error: any) {
    console.error('SEO Analysis Error:', error)
    return NextResponse.json(
      { error: error.message || 'SEO analysis failed' },
      { status: 500 }
    )
  }
}
