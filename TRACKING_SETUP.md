# 📊 Tracking Script Kurulum Kılavuzu

## 🚀 Hızlı Başlangıç

Her 4 website'ine aşağıdaki kodu `<head>` tagının içine ekle:

### 1. drkeremal.com

```html
<script>
  window.WEBMASTER_SITE_ID = 'drkeremal.com';
</script>
<script src="https://qiboowebmasterapp.vercel.app/tracking/webmaster-analytics.js" async></script>
```

### 2. gongsahne.com

```html
<script>
  window.WEBMASTER_SITE_ID = 'gongsahne.com';
</script>
<script src="https://qiboowebmasterapp.vercel.app/tracking/webmaster-analytics.js" async></script>
```

### 3. anityacavehouse.com

```html
<script>
  window.WEBMASTER_SITE_ID = 'anityacavehouse.com';
</script>
<script src="https://qiboowebmasterapp.vercel.app/tracking/webmaster-analytics.js" async></script>
```

### 4. qiboo.ai

```html
<script>
  window.WEBMASTER_SITE_ID = 'qiboo.ai';
</script>
<script src="https://qiboowebmasterapp.vercel.app/tracking/webmaster-analytics.js" async></script>
```

---

## ✅ Ne Takip Ediliyor?

Script otomatik olarak şunları toplar:

- ✅ **Pageviews** - Her sayfa ziyareti
- ✅ **User sessions** - Unique visitor tracking
- ✅ **Device type** - Desktop/Mobile/Tablet
- ✅ **Referrer** - Ziyaretçi nereden geldi
- ✅ **Time on page** - Sayfada geçirilen süre
- ✅ **Scroll depth** - Sayfa ne kadar scroll edildi
- ✅ **Outbound clicks** - Dışarı giden linkler
- ✅ **JavaScript errors** - Otomatik hata yakalama
- ✅ **Unhandled promise rejections** - Async hatalar

---

## 🔧 Custom Event Tracking (Opsiyonel)

Özel olayları takip etmek için:

```javascript
// Örnek: Form gönderme
document.querySelector('form').addEventListener('submit', function() {
  window.webmasterTrack('form_submit', {
    formName: 'contact_form',
    formLocation: window.location.pathname
  });
});

// Örnek: Button click
document.querySelector('#cta-button').addEventListener('click', function() {
  window.webmasterTrack('cta_click', {
    buttonText: this.textContent,
    buttonLocation: 'homepage_hero'
  });
});
```

---

## 🎯 Vercel'de CRON_SECRET Düzeltme

1. Vercel Dashboard → qiboowebmasterapp → Settings → Environment Variables
2. `CRON_SECRET` değerini bul
3. Eğer yoksa veya farklıysa, ekle/güncelle:

```
CRON_SECRET=+4/xq+6nWdrAUlf8PE1mEu3oP5gFXUyzD1jmaCzlTY0=
```

4. Production, Preview, Development için "All" seç
5. Save → Redeploy

---

## 📱 Chatbot Log Entegrasyonu (Opsiyonel)

Eğer chatbot'ların varsa, konuşmaları loglamak için:

```javascript
// Chatbot conversation başladığında
fetch('https://qiboowebmasterapp.vercel.app/api/chatbot/log', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'start',
    domain: 'drkeremal.com',
    session_id: 'unique-session-id-here'
  })
});

// Her mesajda
fetch('https://qiboowebmasterapp.vercel.app/api/chatbot/log', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'message',
    domain: 'drkeremal.com',
    session_id: 'same-session-id',
    message: {
      role: 'user', // or 'assistant'
      content: 'Merhaba!'
    }
  })
});

// Conversation bittiğinde
fetch('https://qiboowebmasterapp.vercel.app/api/chatbot/log', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'end',
    domain: 'drkeremal.com',
    session_id: 'same-session-id'
  })
});
```

---

## ✅ Kontrol Listesi

- [ ] drkeremal.com - tracking script eklendi
- [ ] gongsahne.com - tracking script eklendi
- [ ] anityacavehouse.com - tracking script eklendi
- [ ] qiboo.ai - tracking script eklendi
- [ ] Vercel CRON_SECRET düzeltildi
- [ ] (Opsiyonel) Chatbot entegrasyonu yapıldı
- [ ] Dashboard'da verileri kontrol et

---

## 🧪 Test Etme

1. Website'lerinden birine git
2. Browser console'u aç (F12)
3. Şu mesajı gör: `[Webmaster Analytics] Tracking initialized for site: drkeremal.com`
4. Dashboard'a git: https://qiboowebmasterapp.vercel.app/dashboard/analytics
5. Birkaç dakika sonra verileri gör!

---

## 🆘 Sorun Giderme

**Veri görünmüyor:**
- Browser console'da hata var mı kontrol et
- Network tab'da `/api/track` request'leri görüyor musun?
- WEBMASTER_SITE_ID doğru mu? (domain ile eşleşmeli)

**CORS hatası:**
- Normal! Script cross-origin olarak çalışıyor
- Vercel API CORS'u otomatik handle ediyor

**Script yüklenmiyor:**
- URL doğru mu kontrol et
- Vercel deployment'ı başarılı mı?
