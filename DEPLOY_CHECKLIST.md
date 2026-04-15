# 🚀 Production Deploy Checklist - RLS Security Fix

## ✅ Local'de Tamamlananlar
- [x] RLS migration uygulandı (Supabase SQL Editor'de)
- [x] Dashboard pages service role kullanacak şekilde güncellendi
- [x] Local test başarılı (http://localhost:3002)
- [x] API tracking endpoint test edildi ve çalışıyor

## 📝 Production'a Deploy Öncesi

### 1. Vercel Environment Variables Kontrolü
Vercel Dashboard → Settings → Environment Variables

Kontrol edilmesi gerekenler:
```bash
✓ SUPABASE_SERVICE_ROLE_KEY     # Service role key (başında eyJ... olan)
✓ NEXT_PUBLIC_SUPABASE_URL      # https://qkpizxniwuglawerqvgi.supabase.co
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY # Anon key (başında eyJ... olan)
```

**ÖNEMLİ:** `SUPABASE_SERVICE_ROLE_KEY` production'da set edilmiş mi?

Kontrol etmek için:
```bash
vercel env ls
```

Yoksa ekle:
```bash
vercel env add SUPABASE_SERVICE_ROLE_KEY
# Supabase Dashboard → Project Settings → API → service_role key'i yapıştır
```

### 2. Git Push
```bash
# Değişiklikleri kontrol et
git status

# Commit ve push (eğer henüz yapmadıysan)
git add .
git commit -m "security: Enable RLS and update dashboard to use service role

- Enable Row-Level Security on all tables
- Create security policies (service role + limited anon access)
- Update dashboard pages to use createServiceRoleClient()
- Keep API tracking endpoints using anon key for public access
- Fix critical Supabase security vulnerabilities"

git push origin main
```

### 3. Vercel Deploy
Push sonrası otomatik deploy başlayacak. İzle:
```bash
vercel --prod
```

Ya da Vercel Dashboard'dan takip et.

### 4. Production Test
Deploy tamamlandıktan sonra test et:

**Dashboard Sayfaları:**
- [ ] https://your-domain.com/dashboard
- [ ] https://your-domain.com/dashboard/analytics
- [ ] https://your-domain.com/dashboard/errors
- [ ] https://your-domain.com/dashboard/uptime
- [ ] https://your-domain.com/dashboard/seo

**API Endpoints:**
```bash
# Analytics tracking
curl -X POST https://your-domain.com/api/track \
  -H "Content-Type: application/json" \
  -d '{
    "siteId": "drkeremal.com",
    "eventType": "pageview",
    "sessionId": "test-session",
    "url": "/test"
  }'

# Sonuç: {"success":true}
```

### 5. Supabase Security Verification
Supabase Dashboard'da kontrol et:

**A. RLS Status:**
1. Supabase Dashboard → Table Editor
2. Her table için "Enable RLS" switch'i açık mı?

**B. Policies:**
1. Supabase Dashboard → Authentication → Policies
2. Her table için policies görünüyor mu?

**C. Security Advisors:**
1. Supabase Dashboard → Project → Advisors
2. ⚠️ Critical issues gitti mi?

SQL ile kontrol:
```sql
-- RLS enabled tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Should all show: rowsecurity = true
```

### 6. Monitoring (İlk 24 Saat)
Production'da izlenmesi gerekenler:

**Vercel Logs:**
```bash
vercel logs --follow
```

**Kontrol Edilecek:**
- [ ] RLS hatası yok (new Error: permission denied for table...)
- [ ] Dashboard sayfaları düzgün yükleniyor
- [ ] Analytics verisi kaydediliyor
- [ ] Error tracking çalışıyor

**Supabase Logs:**
1. Supabase Dashboard → Logs
2. Unusual API activity yok mu?
3. Policy violation hatası yok mu?

## 🆘 Sorun Çıkarsa

### Dashboard "No Data" Gösteriyorsa
```bash
# Production'da service role key eksik olabilir
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Deploy'u tekrarla
vercel --prod
```

### API Tracking Çalışmıyorsa
Supabase policies kontrol et. Anon INSERT policy eksik olabilir:
```sql
-- Kontrol et
SELECT * FROM pg_policies
WHERE tablename = 'analytics_events'
AND policyname LIKE '%insert%';

-- Yoksa ekle
CREATE POLICY "Anon can insert analytics_events"
  ON analytics_events
  FOR INSERT
  TO anon
  WITH CHECK (true);
```

### Rollback Gerekirse
```bash
# Local'e geri dön
git revert HEAD
git push

# Supabase'de RLS'i geçici kapat (ÖNERİLMEZ)
ALTER TABLE websites DISABLE ROW LEVEL SECURITY;
# ... diğer tablolar için tekrarla
```

## ✅ Deploy Sonrası
- [ ] Backup dosyalarını sil: `find app/dashboard -name "*.backup" -delete`
- [ ] Supabase security email'ini kontrol et (uyarı gitmiş olmalı)
- [ ] Incident response plan hazırla
- [ ] Monitoring alerts kur

## 📊 Success Metrics
Production'da başarılı deployment için:
- ✅ Zero RLS errors in Vercel logs
- ✅ Dashboard loads in <2s
- ✅ Analytics tracking working
- ✅ Supabase security warnings resolved
- ✅ No unauthorized database access attempts

## 🎉 Tebrikler!
Database'in artık güvenli ve production-ready!
