# 🚀 Cloudflare Worker Deployment Guide

## Adım 1: Wrangler Kurulumu

```bash
npm install -g wrangler
```

## Adım 2: Cloudflare'a Giriş

```bash
wrangler login
```

Tarayıcı açılacak, Cloudflare hesabınızla giriş yapın.

## Adım 3: Worker'ı Deploy Et

```bash
cd workers
wrangler deploy
```

Terminal çıktısı:
```
✨ Built successfully
✨ Successfully published your script to
   https://rss-proxy.YOUR-NAME.workers.dev
```

## Adım 4: Worker URL'ini Kopyala

Deploy sonrası size verilen URL'i kopyalayın:
```
https://rss-proxy.YOUR-NAME.workers.dev
```

## Adım 5: news.js'i Güncelle

`js/news.js` dosyasında 24. satırı değiştir:

**Önce:**
```javascript
this.workerUrl = null; // Will be set after deployment
```

**Sonra:**
```javascript
this.workerUrl = 'https://rss-proxy.YOUR-NAME.workers.dev';
```

## Adım 6: Test Et

Tarayıcıda worker URL'ini test edin:
```
https://rss-proxy.YOUR-NAME.workers.dev/?url=https://www.foreks.com/rss/haber.xml
```

Şunu görmelisiniz:
```json
{
  "status": "ok",
  "feed": {
    "url": "https://www.foreks.com/rss/haber.xml",
    "title": "Foreks Haberler"
  },
  "items": [
    {
      "title": "...",
      "link": "...",
      "description": "...",
      "pubDate": "..."
    }
  ],
  "count": 20
}
```

## Adım 7: Push & Deploy

```bash
git add -A
git commit -m "feat: Configure Cloudflare Worker for RSS"
git push origin main
```

Cloudflare Pages otomatik deploy edecek!

## ✅ Başarı Kontrolü

1. Sitenizi açın
2. Haberler sayfasına gidin
3. F12 → Console açın
4. Şunu görmelisiniz:
```
🔄 Fetching bloombergHT via Worker...
✅ bloombergHT loaded: 20 items
🔄 Fetching investing via Worker...
✅ investing loaded: 20 items
✅ Total 80 real-time Turkish news loaded
```

## 🔧 Troubleshooting

### Worker çalışmıyor?
```bash
cd workers
wrangler tail
```
Canlı logları izleyin.

### CORS hatası?
Worker'da CORS headers zaten var, sorun yok.

### RSS parse hatası?
Worker loglarına bakın:
```bash
wrangler tail rss-proxy
```

## 💰 Maliyet

**ÜCRETSİZ!**
- 100,000 request/gün
- Haber sitesi için yeterli
- Ek ücret yok

## 🔄 Güncelleme

Worker kodunu değiştirdikten sonra:
```bash
cd workers
wrangler deploy
```

Hepsi bu kadar!
