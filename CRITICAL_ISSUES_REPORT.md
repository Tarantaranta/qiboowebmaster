# 🚨 KRİTİK SORUNLAR RAPORU - 2026-03-19

## ÖZET: NEDEN HİÇ VERİ YOK?

Dashboard'ların **%95'i boş** çünkü **3 kritik sorun var:**

| # | Sorun | Etkilenen Sayfalar | Durum |
|---|-------|-------------------|-------|
| **1** | Google Search Console API kapalı | SEO Dashboard, Keywords | 🔴 URGENT |
| **2** | PageSpeed API quota aşıldı | Performance Dashboard | 🔴 URGENT |
| **3** | Tracking script'leri yüklü değil | Analytics, User Flows, Real-time | 🔴 URGENT |

---

## 🔴 SORUN #1: GOOGLE SEARCH CONSOLE API KAPALI

### ❌ Problem

```
Google Search Console API has not been used in project 390177696922
before or it is disabled.
```

**Etki:**
- SEO Dashboard → **TAMAMEN BOŞ** (0 click, 0 impression)
- Keywords → **TAMAMEN BOŞ** (0 keyword)
- Cron job `search-console-sync` çalışıyor ama **hata veriyor**

### ✅ Çözüm (5 dakika)

#### Adım 1: API'yi Enable Et

Bu linke tıkla ve "**ENABLE**" butonuna bas:
👉 **https://console.developers.google.com/apis/api/searchconsole.googleapis.com/overview?project=390177696922**

Veya manuel:
1. https://console.cloud.google.com/apis/dashboard?project=sound-vault-487123-f1
2. "+ ENABLE APIS AND SERVICES"
3. "Search Console API" ara
4. **ENABLE** bas

#### Adım 2: Service Account'u Website'lere Ekle

**Service Account Email:**
```
webmaster-analytics-reader@sound-vault-487123-f1.iam.gserviceaccount.com
```

Her website için (4 adet):

1. https://search.google.com/search-console
2. Website seç (örn: **drkeremal.com**)
3. **Settings** → **Users and permissions**
4. **Add User** → Email'i yapıştır
5. Permission: **Full**
6. **Add**

Tüm siteler:
- [ ] drkeremal.com
- [ ] gongsahne.com
- [ ] anityacavehouse.com
- [ ] qiboo.ai

#### Adım 3: Test Et

```bash
node scripts/test-search-console.js
```

Başarılı olursa göreceksin:
```
✅ Service account working: YES
✅ Sites accessible: 4
✅ Data found! → 123 queries
```

#### Adım 4: Cron Job'ı Manuel Tetikle

Vercel Dashboard → Cron Jobs → **search-console-sync** → Run

5 dakika sonra SEO Dashboard'a git → **Veri dolu olmalı!**

---

## 🔴 SORUN #2: PAGESPEED API QUOTA AŞILDI

### ❌ Problem

```
Error 429: Quota exceeded for quota metric 'Queries'
and limit 'Queries per day' of service 'pagespeedonline.googleapis.com'
```

**Metadata:**
```json
{
  "quota_limit_value": "0",
  "quota_limit": "defaultPerDayPerProject",
  "quota_unit": "1/d/{project}"
}
```

**Etki:**
- Performance Dashboard → **Güncel veri gelmiyor**
- PageSpeed scores var ama **eski snapshot'lar**
- Yeni test'ler çalışmıyor

### ✅ Çözüm (2 seçenek)

#### Seçenek A: API Quota'yı Artır (ÖNERİLEN)

1. https://console.cloud.google.com/apis/api/pagespeedonline.googleapis.com/quotas
2. Project seç: **sound-vault-487123-f1**
3. **Queries per day** quota'sını bul
4. **EDIT QUOTAS** → Artış talep et (örn: 25,000/day)
5. Google approval bekle (genelde otomatik)

#### Seçenek B: Farklı Project Kullan

PageSpeed API şu anda farklı bir project kullanıyor (project: 583797351490).
Bu project'in quota'sı 0. Yeni API key oluştur:

1. https://console.cloud.google.com/apis/credentials?project=sound-vault-487123-f1
2. **+ CREATE CREDENTIALS** → **API Key**
3. Yeni key'i kopyala
4. Vercel → Environment Variables
5. `GOOGLE_PAGESPEED_API_KEY` → Yeni key ile değiştir
6. Redeploy

---

## 🔴 SORUN #3: TRACKING SCRIPT'LERİ YÜKLÜ DEĞİL

### ❌ Problem

Analytics Dashboard'da **sadece 4 pageview** var çünkü:
- Website'lerde tracking script yüklü değil
- Gerçek kullanıcı trafiği kaydedilmiyor
- Sadece test verileri var

**Etki:**
- Analytics → **Neredeyse boş** (4 pageview, 4 unique visitor)
- User Flows → **Boş**
- Real-time → **Boş** (0 active users)
- Bounce Rate → **100%** (yanlış - veri yok)

### ✅ Çözüm

#### Tracking Script'ini Her Website'e Ekle

Her website'in (`drkeremal.com`, `gongsahne.com`, vb.) `<head>` tag'ine ekle:

```html
<script>
  (function() {
    const WEBMASTER_API = 'https://qiboowebmasterapp.vercel.app';
    const WEBSITE_ID = 'YOUR_WEBSITE_ID_HERE'; // Supabase'den al

    // Session ID oluştur (her ziyaretçi için benzersiz)
    let sessionId = sessionStorage.getItem('webmaster_session');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('webmaster_session', sessionId);
    }

    // Pageview track et
    function trackPageview() {
      fetch(WEBMASTER_API + '/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId: WEBSITE_ID,
          eventType: 'pageview',
          pageUrl: window.location.href,
          referrer: document.referrer,
          userAgent: navigator.userAgent,
          sessionId: sessionId
        })
      }).catch(err => console.error('Analytics error:', err));
    }

    // İlk pageview
    trackPageview();

    // SPA için: sayfa değişikliklerini dinle (Next.js, React Router, vb.)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        trackPageview();
      }
    }).observe(document, {subtree: true, childList: true});

    // Error tracking
    window.addEventListener('error', (event) => {
      fetch(WEBMASTER_API + '/api/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId: WEBSITE_ID,
          errorType: 'JavaScript',
          errorMessage: event.message,
          stackTrace: event.error?.stack,
          pageUrl: window.location.href,
          userAgent: navigator.userAgent
        })
      }).catch(() => {});
    });

    // Performance tracking (Core Web Vitals)
    if ('PerformanceObserver' in window) {
      function sendMetric(metric) {
        fetch(WEBMASTER_API + '/api/performance/metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            websiteId: WEBSITE_ID,
            pageUrl: window.location.href,
            metricName: metric.name,
            metricValue: metric.value
          })
        }).catch(() => {});
      }

      // LCP (Largest Contentful Paint)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        sendMetric({ name: 'LCP', value: lastEntry.renderTime || lastEntry.loadTime });
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // FID/INP (Interaction to Next Paint)
      new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          sendMetric({ name: 'INP', value: entry.processingStart - entry.startTime });
        });
      }).observe({ entryTypes: ['first-input'] });

      // CLS (Cumulative Layout Shift)
      let clsScore = 0;
      new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsScore += entry.value;
          }
        });
      }).observe({ entryTypes: ['layout-shift'] });

      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          sendMetric({ name: 'CLS', value: clsScore });
        }
      });
    }
  })();
</script>
```

#### Website ID'leri Bul

Supabase'den website ID'lerini al:

```sql
SELECT id, domain FROM websites;
```

Veya dashboard'dan:
- https://qiboowebmasterapp.vercel.app/dashboard → Website ID'leri görebilirsin

#### Test Et

1. Script'i ekle
2. Website'i ziyaret et
3. 30 saniye bekle
4. Analytics Dashboard → Yeni pageview görmelisin
5. Real-time → Active user: 1

---

## 📊 VERİ ATRİBUTİON SORUNU (BONUS)

### ❌ Problem

Bazı sayfalarda **hangi verinin hangi website'e ait olduğu belli değil.**

Örnek:
- Analytics page → Website name göstermiyor
- User Flows → Hangi site'in flow'u belli değil

### ✅ Çözüm

Dashboard component'lerini güncelle - her veri satırında website adını göster.

**Yapılacak:**
- [ ] Analytics chart'larına website filter ekle
- [ ] User Flows'da website name göster
- [ ] Top pages'de website column ekle

---

## 🎯 ACİL EYLEM PLANI (15 DAKİKA)

### ⏱️ 5 Dakika: Search Console Fix

1. [ ] API enable et: https://console.developers.google.com/apis/api/searchconsole.googleapis.com/overview?project=390177696922
2. [ ] Service account ekle (4 website)
3. [ ] Test: `node scripts/test-search-console.js`
4. [ ] Cron job tetikle: Vercel → search-console-sync

### ⏱️ 5 Dakika: PageSpeed Fix

1. [ ] https://console.cloud.google.com/apis/api/pagespeedonline.googleapis.com/quotas
2. [ ] Quota artır veya yeni API key oluştur
3. [ ] Vercel env update
4. [ ] Test: `npm run test:all`

### ⏱️ 5 Dakika: Tracking Script

1. [ ] Website ID'leri al (Supabase)
2. [ ] Script'i drkeremal.com'a ekle (test için)
3. [ ] Website'i ziyaret et
4. [ ] Dashboard'da veriyi gör
5. [ ] Diğer sitelere de ekle

---

## ✅ BAŞARI KRİTERLERİ

Test et:

```bash
npm run test:all
```

Başarılı olursa:
```
✅ PASSED: 38/38
❌ FAILED: 0
```

Dashboard'da göreceksin:
- ✅ SEO Dashboard → Clicks & Impressions dolu
- ✅ Performance → PageSpeed scores güncel
- ✅ Analytics → Real-time traffic
- ✅ User Flows → Session data
- ✅ Keywords → Rankings

---

## 📞 DESTEK

Sorun devam ederse:

1. **Search Console Test:**
   ```bash
   node scripts/test-search-console.js
   ```

2. **Comprehensive Test:**
   ```bash
   npm run test:all
   ```

3. **Logs:**
   - Vercel Dashboard → Logs
   - Cron job execution logs
   - API error messages

---

**Oluşturulma:** 2026-03-19 14:30
**Durum:** 🔴 ACİL - API'lar enable edilmeli
**Tahmini Çözüm Süresi:** 15 dakika
