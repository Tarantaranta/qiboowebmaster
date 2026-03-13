import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  OpenAI API key not configured. AI features will be disabled.')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
})

type AnalysisMode = 'quick' | 'deep'

export async function analyzeSEO(
  websiteUrl: string,
  pageContent: string,
  htmlContent: string,
  mode: AnalysisMode = 'quick'
) {
  const model = mode === 'deep' ? 'o1-preview' : 'gpt-4o'

  const systemPrompt = mode === 'deep'
    ? `Sen dünyaca ünlü bir Technical SEO uzmanısın. 20+ yıllık deneyimin var.

    Verilen web sayfasını EN DETAYLI şekilde analiz et. Şunları kapsayan KAPSAMLI bir rapor hazırla:

    ## 1. TECHNICAL SEO (Kritik Öncelikli)
    - Meta tags (title, description, robots, canonical)
    - Structured Data & Schema.org implementation
    - Open Graph & Twitter Cards
    - Hreflang tags (çok dilli SEO)
    - XML Sitemap existence
    - Robots.txt configuration
    - SSL/HTTPS status
    - Page speed & Core Web Vitals
    - Mobile-friendliness & responsive design
    - Accessibility (WCAG compliance)
    - Internal linking structure
    - URL structure & permalinks
    - Duplicate content issues
    - Broken links & 404 errors
    - Image optimization (alt tags, lazy loading, WebP)
    - JavaScript & CSS optimization
    - Header tags hierarchy (H1-H6)
    - Canonical URLs

    ## 2. CONTENT ANALYSIS
    - Keyword usage & density
    - LSI keywords (semantically related)
    - Content length & depth
    - Readability score (Flesch-Kincaid)
    - Thin content detection
    - Duplicate content
    - Content freshness
    - E-A-T signals (Expertise, Authority, Trust)
    - YMYL considerations

    ## 3. COMPETITIVE INSIGHTS
    - Content gaps (ne eksik?)
    - Keyword opportunities
    - Backlink strategy recommendations
    - Competitor advantage points

    ## 4. PRIORITY MATRIX
    Her öneri için:
    - Impact Score (1-10): Trafik etkisi
    - Effort Score (1-10): Uygulama zorluğu
    - Priority: Critical/High/Medium/Low
    - Implementation steps

    ## 5. EXPECTED RESULTS
    - Tahmini trafik artışı (%)
    - Rank improvement prediction
    - Timeline (ne kadar sürede sonuç)

    Türkçe, çok detaylı, adım adım uygulanabilir öneriler sun.`
    : `Sen deneyimli bir SEO uzmanısın. Verilen web sayfasını analiz edip actionable SEO önerileri ver.

    Odaklan:
    - Title ve meta description optimizasyonu
    - Keyword usage ve density
    - Content quality ve readability
    - Internal/external linking
    - Image optimization
    - Technical SEO basics (schema, og tags, canonical)
    - Mobile-friendliness
    - Core Web Vitals iyileştirmeleri
    - Quick wins (hızlı kazanımlar)

    Türkçe yanıt ver, net ve öncelikli öneriler sun.`

  try {
    if (mode === 'deep') {
      // o1-preview için farklı API call (reasoning model)
      const completion = await openai.chat.completions.create({
        model: 'o1-preview',
        messages: [
          {
            role: 'user',
            content: `${systemPrompt}\n\nWebsite: ${websiteUrl}\n\nSayfa içeriği:\n${pageContent.slice(0, 25000)}\n\nHTML snippet:\n${htmlContent.slice(0, 5000)}`
          }
        ],
      })
      return completion.choices[0]?.message?.content || 'Analiz yapılamadı'
    } else {
      // gpt-4o için normal call
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Website: ${websiteUrl}\n\nSayfa içeriği:\n${pageContent.slice(0, 15000)}\n\nHTML snippet:\n${htmlContent.slice(0, 3000)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      })
      return completion.choices[0]?.message?.content || 'Analiz yapılamadı'
    }
  } catch (error: any) {
    console.error('OpenAI SEO Analysis Error:', error)
    throw new Error(error.message || 'AI analizi başarısız')
  }
}

export async function generateKeywordSuggestions(websiteName: string, websiteDescription: string, currentKeywords: string[] = []) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Sen bir SEO keyword uzmanısın. Website için en uygun ve yüksek potansiyelli keyword önerileri sun. Search volume ve competition dengesi düşün.'
        },
        {
          role: 'user',
          content: `Website: ${websiteName}
Açıklama: ${websiteDescription}
Mevcut keywords: ${currentKeywords.join(', ') || 'yok'}

20 adet keyword önerisi yap. Hem short-tail hem long-tail keywords ekle. JSON array formatında dön: ["keyword1", "keyword2", ...]`
        }
      ],
      temperature: 0.8,
      max_tokens: 500,
    })

    const response = completion.choices[0]?.message?.content || '[]'
    try {
      return JSON.parse(response)
    } catch {
      // JSON parse başarısız olursa, satır satır keyword'leri çıkar
      return response.split('\n').filter(line => line.trim()).slice(0, 20)
    }
  } catch (error: any) {
    console.error('OpenAI Keyword Suggestions Error:', error)
    return []
  }
}

export async function generateMetaDescription(pageTitle: string, pageContent: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Sen bir SEO copywriter\'sın. Verilen sayfa için optimal meta description oluştur. 150-160 karakter arası, action-oriented, keyword-rich ama doğal.'
        },
        {
          role: 'user',
          content: `Sayfa başlığı: ${pageTitle}\n\nİçerik özeti:\n${pageContent.slice(0, 2000)}`
        }
      ],
      temperature: 0.7,
      max_tokens: 100,
    })

    return completion.choices[0]?.message?.content?.replace(/['"]/g, '') || ''
  } catch (error) {
    console.error('OpenAI Meta Description Error:', error)
    return ''
  }
}

export async function analyzeCompetitor(yourWebsite: string, competitorWebsite: string, competitorContent: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Sen bir competitive SEO analisti\'sin. Rakip sitesini analiz edip, kullanıcının sitesi için stratejik öneriler sun.'
        },
        {
          role: 'user',
          content: `Benim sitem: ${yourWebsite}
Rakip site: ${competitorWebsite}

Rakip site içeriği:\n${competitorContent.slice(0, 5000)}

Analiz et:
1. Rakibin güçlü yönleri
2. Rakibin zayıf yönleri
3. Bizim için fırsatlar
4. Keyword gaps
5. Content strategy önerileri

Türkçe, net ve actionable yanıt ver.`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    return completion.choices[0]?.message?.content || ''
  } catch (error) {
    console.error('OpenAI Competitor Analysis Error:', error)
    throw error
  }
}
